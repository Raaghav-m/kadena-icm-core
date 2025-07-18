import fs from "fs";
import path from "path";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import inquirer from "inquirer";
import yaml from "js-yaml";
import {
  Pact,
  createClient,
  createSignWithKeypair,
  isSignedTransaction,
} from "@kadena/client";
import type { ChainId, ICommand } from "@kadena/client";
import { execSync } from "child_process";
import { CLIENT_RENEG_LIMIT } from "tls";

interface AccountConfig {
  publicKey: string;
  secretKey: string;
}

const argv = yargs(hideBin(process.argv))
  .option("file", {
    alias: "f",
    describe: "Path to Pact source file",
    type: "string",
  })
  .option("account", {
    describe: "Path to testing-account.yaml file",
    type: "string",
    default: "testing-account.yaml",
  })
  .option("host", {
    describe: "Chainweb node host",
    default: "http://localhost:8080",
    type: "string",
  })
  .option("network", {
    describe: "Network ID",
    default: "development",
    type: "string",
  })
  .option("chain", { describe: "Chain ID", default: "0", type: "string" })
  .strict()
  .help().argv as any;

async function ensure<T extends keyof typeof argv>(
  key: T,
  message: string,
  def?: string
) {
  if (argv[key]) return argv[key] as string;
  const { val } = await inquirer.prompt<{ val: string }>({
    type: "input",
    name: "val",
    message,
    default: def,
  });
  return val as string;
}

function loadAccountConfig(accountPath: string): AccountConfig {
  try {
    const yamlContent = fs.readFileSync(path.resolve(accountPath), "utf-8");
    const config = yaml.load(yamlContent) as AccountConfig;

    if (!config.publicKey || !config.secretKey) {
      throw new Error(
        "acc.yaml must contain both publicKey and secretKey fields"
      );
    }

    return config;
  } catch (error: any) {
    if (error.code === "ENOENT") {
      throw new Error(`Account file not found: ${accountPath}`);
    }
    throw new Error(`Failed to load account config: ${error.message}`);
  }
}

function parseInitArgs(code: string): { name: string; type: string }[] {
  const fnMatch = code.match(/\(defun\s+init\s*\(([^)]*)\)/);
  console.log(fnMatch);

  if (!fnMatch) return []; // no init function at all

  const argsRaw = fnMatch[1]
    .split(",")
    .map((arg) => arg.trim())
    .filter(Boolean);

  return argsRaw.map((arg) => {
    const match = arg.match(/(\w+)\s*:\s*([\w\-\.\[\]\{\}]+)/);
    if (match) return { name: match[1], type: match[2] };
    return { name: arg, type: "unknown" };
  });
}

(async () => {
  const file = await ensure("file", "Pact file path:");
  const accountPath = await ensure(
    "account",
    "Account config path:",
    "testing-account.yaml"
  );

  // Load account config from YAML file
  let accountConfig: AccountConfig;
  try {
    accountConfig = loadAccountConfig(accountPath);
    console.log(`✅ Loaded account config from ${accountPath}`);
  } catch (error: any) {
    console.error(`❌ ${error.message}`);
    process.exit(1);
  }

  // Use keys from config and create sender account
  const pub = accountConfig.publicKey;
  const priv = accountConfig.secretKey;
  const sender = `k:${pub}`;

  console.log(`📋 Using public key: ${pub}`);
  console.log(`📋 Using sender account: ${sender}`);

  const host = await ensure("host", "Node host:", "http://localhost:8080");
  const network = await ensure("network", "Network ID:", "development");
  const chain = (await ensure("chain", "Chain ID:", "0")) as ChainId;

  const code = fs.readFileSync(path.resolve(file), "utf-8");
  const initArgs = parseInitArgs(code);

  const userInput: Record<string, string> = {};
  for (const { name, type } of initArgs) {
    const response = await inquirer.prompt<{ val: string }>({
      type: "input",
      name: "val",
      message: `Enter value for constructor arg '${name}' (${type}):`,
    });
    userInput[name] = response.val;
  }
  console.log(initArgs.length);

  // --- Auto-inject keyset data for any (read-keyset 'ks-name) found ---
  const keysetMatches = [
    ...code.matchAll(/read-keyset\s+(?:'|")([\w\-\.]+)(?:'|")/g),
  ];
  console.log(code);
  console.log(keysetMatches);
  const data: Record<string, any> = {};
  keysetMatches.forEach(([, ks]) => {
    if (!data[ks]) {
      data[ks] = { keys: [pub], pred: "keys-all" };
    }
  });

  const builder = Pact.builder.execution(code);
  for (const [key, value] of Object.entries(data)) {
    builder.addData(key, value); // 👈 correct usage
  }
  builder.addData("upgrade", false);

  const unsignedDeploy = builder
    .addSigner(pub, (withCap: any) => [withCap("coin.GAS")])
    .setMeta({
      chainId: chain,
      senderAccount: sender,
      gasLimit: 25000,
      gasPrice: 0.0000001,
    })
    .setNetworkId(network)
    .createTransaction();

  const signer = createSignWithKeypair({ publicKey: pub, secretKey: priv });
  const signedDeploy = await signer(unsignedDeploy);
  if (!isSignedTransaction(signedDeploy))
    throw new Error("Deploy signing failed");

  const client = createClient(
    `${host}/chainweb/0.0/${network}/chain/${chain}/pact`
  );
  console.log("\n📦 Deploying module...");
  const deployReqKey = await client.submit(signedDeploy);
  const deployRes = await client.listen(deployReqKey);
  console.log("✅ Module deployed:\n", JSON.stringify(deployRes, null, 2));

  if (initArgs.length > 0) {
    const initCode = `(init ${initArgs.map(({ name }) => JSON.stringify(userInput[name])).join(" ")})`;
    console.log(initCode);

    const unsignedInit = Pact.builder
      .execution(initCode)
      .addSigner(pub, (withCap) => [withCap("coin.GAS")])
      .setMeta({
        chainId: chain,
        senderAccount: sender,
        gasLimit: 25000,
        gasPrice: 0.0000001,
      })
      .setNetworkId(network)
      .createTransaction();

    const signedInit = await signer(unsignedInit);
    if (!isSignedTransaction(signedInit))
      throw new Error("Init signing failed");

    console.log("\n🚀 Calling (init ...) with args...");
    const initReqKey = await client.submit(signedInit);
    const initRes = await client.listen(initReqKey);
    console.log("✅ Init result:\n", JSON.stringify(initRes, null, 2));
  } else {
    console.log(
      "ℹ️ No (init) function found or it takes no arguments — skipping init call."
    );
  }

  try {
    const jsonStr = execSync(`ts-node script.ts \"${file}\"`).toString();
    const outPath = path.basename(file, ".pact") + ".json";
    fs.writeFileSync(outPath, jsonStr);
    console.log(`📝 Config saved to ${outPath}`);

    // ---- Copy to Next.js frontend utils folder as helloWorld.json ----
    try {
      const frontendUtilsDir = path.resolve(
        process.cwd(),
        "sample",
        "src",
        "utils"
      );
      fs.mkdirSync(frontendUtilsDir, { recursive: true });
      const destPath = path.join(frontendUtilsDir, "contractConfig.json");
      fs.writeFileSync(destPath, jsonStr);
      console.log(
        `📤 Copied config to ${path.relative(process.cwd(), destPath)}`
      );
    } catch (copyErr: any) {
      console.error(
        "❌ Failed to write config into frontend:",
        copyErr.message
      );
    }
  } catch (err: any) {
    console.error("❌ Failed to generate config JSON:", err.message);
  }
})();
