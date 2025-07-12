import fs from 'fs';
import path from 'path';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import inquirer from 'inquirer';
import {
  Pact,
  createClient,
  createSignWithKeypair,
  isSignedTransaction,
} from '@kadena/client';
import type { ChainId, ICommand } from '@kadena/client';
import { execSync } from 'child_process';

const argv = yargs(hideBin(process.argv))
  .option('file', { alias: 'f', describe: 'Path to Pact source file', type: 'string' })
  .option('pub', { describe: 'Public key that will sign & own the module', type: 'string' })
  .option('priv', { describe: 'Corresponding secret key (dev/test only)', type: 'string' })
  .option('sender', { describe: 'Account that pays gas (alias or k:pubkey)', type: 'string' })
  .option('host', { describe: 'Chainweb node host', default: 'http://localhost:8080', type: 'string' })
  .option('network', { describe: 'Network ID', default: 'development', type: 'string' })
  .option('chain', { describe: 'Chain ID', default: '0', type: 'string' })
  .strict()
  .help().argv as any;

async function ensure<T extends keyof typeof argv>(key: T, message: string, def?: string) {
  if (argv[key]) return argv[key] as string;
  const { val } = await inquirer.prompt<{ val: string }>({
    type: 'input',
    name: 'val',
    message,
    default: def,
  });
  return val as string;
}

function parseConstructorArgs(code: string): { name: string; type: string }[] {
  const moduleMatch = code.match(/\(module\s+\w+\s+\w+\s*\(([^)]*)\)/);
  if (!moduleMatch) return [];

  return moduleMatch[1]
    .split(',')
    .map(arg => arg.trim())
    .filter(Boolean)
    .map(arg => {
      const match = arg.match(/(\w+)\s*:\s*([\w\-\.\[\]\{\}]+)/);
      if (match) return { name: match[1], type: match[2] };
      else return { name: arg, type: 'unknown' };
    });
}

(async () => {
  const file = await ensure('file', 'Pact file path:');
  const sender = await ensure('sender', 'Sender account:');
  const pub = await ensure('pub', 'Public key:');
  const priv = await ensure('priv', 'Private key (dev only):');
  const host = await ensure('host', 'Node host:', 'http://localhost:8080');
  const network = await ensure('network', 'Network ID:', 'development');
  const chain = await ensure('chain', 'Chain ID:', '0') as ChainId;

  const code = fs.readFileSync(path.resolve(file), 'utf-8');
  const args = parseConstructorArgs(code);

  const argInputs: Record<string, string> = {};
  for (const { name, type } of args) {
    const response = await inquirer.prompt<{ val: string }>({
      type: 'input',
      name: 'val',
      message: `Enter value for constructor arg '${name}' (${type}):`,
    });
    argInputs[name] = response.val;
  }

  const moduleAppCall = args.length
    ? `(${Object.entries(argInputs)
        .map(([_, val]) => JSON.stringify(val))
        .join(' ')})`
    : '';

  const fullCode = code + '\n' + moduleAppCall;

  const unsigned = Pact.builder
    .execution(fullCode)
    .addSigner(pub, (withCap) => [withCap('coin.GAS')])
    .setMeta({
      chainId: chain,
      senderAccount: sender,
      gasLimit: 15000,
      gasPrice: 0.0000001,
    })
    .setNetworkId(network)
    .createTransaction();

  const signer = createSignWithKeypair({ publicKey: pub, secretKey: priv });
  const signed = (await signer(unsigned)) as ICommand;
  if (!isSignedTransaction(signed)) throw new Error('Signing failed');

  const client = createClient(`${host}/chainweb/0.0/${network}/chain/${chain}/pact`);

  console.log('Submitting deployment...');
  const reqKey = await client.submit(signed);
  const res = await client.listen(reqKey);
  console.log(JSON.stringify(res, null, 2));

  // Generate JSON config using script.ts and save beside the Pact file
  try {
    const jsonStr = execSync(`ts-node script.ts \"${file}\"`).toString();
    const outPath = path.basename(file, '.pact') + '.json';
    fs.writeFileSync(outPath, jsonStr);
    console.log(`Config saved to ${outPath}`);
  } catch (err: any) {
    console.error('Could not generate config JSON:', err.message);
  }
})();
