// cross_chain_relayer.ts
import {
  createPublicClient,
  createWalletClient,
  http,
  parseAbiItem,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

if (!process.env.PRIVATE_KEY) {
  throw new Error("PRIVATE_KEY environment variable is not set");
}

// Configuration
const CHAIN1_RPC =
  "https://evm-testnet.chainweb.com/chainweb/0.0/evm-testnet/chain/21/evm/rpc";
const CHAIN2_RPC =
  "https://evm-testnet.chainweb.com/chainweb/0.0/evm-testnet/chain/20/evm/rpc";
const POLL_INTERVAL = 2000; // Poll every 2 seconds
const MAX_BLOCK_RANGE = 1000n; // Max blocks per RPC query - reduced to avoid timeouts

// Chain configuration
const chainConfig1 = {
  id: 5921,
  name: "Kadena Chain 21",
  nativeCurrency: { name: "KDA", symbol: "KDA", decimals: 18 },
  rpcUrls: { default: { http: [CHAIN1_RPC] } },
} as const;

const chainConfig2 = {
  id: 5920,
  name: "Kadena Chain 20",
  nativeCurrency: { name: "KDA", symbol: "KDA", decimals: 18 },
  rpcUrls: { default: { http: [CHAIN2_RPC] } },
} as const;

// Contract addresses for both chains
const CHAIN1_SENDER = "0xF95c11D596b1650f11336D33E318475Dc1e21472" as const;

// Create clients
const chain1 = createPublicClient({
  transport: http(CHAIN1_RPC),
  chain: chainConfig1,
});

const chain2 = createPublicClient({
  transport: http(CHAIN2_RPC),
  chain: chainConfig2,
});

const account = privateKeyToAccount(process.env.PRIVATE_KEY as `0x${string}`);
const wallet = createWalletClient({
  account,
  transport: http(CHAIN2_RPC),
  chain: chainConfig2,
});

console.log("\n=== Kadena Cross-Chain Relayer ===");
console.log("Watching Chain 20:", CHAIN1_RPC);
console.log("Relaying to Chain 21:", CHAIN2_RPC);
console.log("Relayer Address:", account.address);
console.log("\nWatching MessageSender:", CHAIN1_SENDER);
console.log("================================\n");

// Keep track of the last block we processed
let lastProcessedBlock = 0n;
let isProcessing = false;
let heartbeatCount = 0;

// Initialize last processed block to current block
async function initializeBlockNumber() {
  lastProcessedBlock = await chain1.getBlockNumber();
  console.log("Starting from block:", lastProcessedBlock.toString());
}

// Function to process new events
async function processNewEvents() {
  if (isProcessing) return;
  isProcessing = true;
  heartbeatCount++;

  try {
    if (heartbeatCount % 10 === 0) {
      console.log("💓 Relayer heartbeat...");
    }

    const currentBlock = await chain1.getBlockNumber();
    if (currentBlock <= lastProcessedBlock) return;

    console.log(
      "\n🔍 Checking blocks",
      lastProcessedBlock.toString(),
      "to",
      currentBlock.toString()
    );

    let from = lastProcessedBlock + 1n;
    const to = currentBlock;

    while (from <= to) {
      const end =
        from + MAX_BLOCK_RANGE - 1n > to ? to : from + MAX_BLOCK_RANGE - 1n;

      const events = await chain1.getLogs({
        address: CHAIN1_SENDER,
        event: parseAbiItem(
          "event MessageSent(address indexed sender, uint256 indexed dstChainId, address indexed dstAddress, bytes data, uint256 nonce)"
        ),
        fromBlock: from,
        toBlock: end,
      });

      if (events.length > 0) {
        console.log(`📨 Found ${events.length} events from ${from} to ${end}`);
      }

      for (const event of events) {
        if (
          !event.args?.dstChainId ||
          !event.args?.dstAddress ||
          !event.args?.data ||
          !event.args?.nonce ||
          !event.args?.sender
        ) {
          console.log("⚠️ Skipping event with missing args");
          continue;
        }

        const { sender, dstChainId, dstAddress, data, nonce } = event.args;

        console.log(`\n🔔 New message detected on Chain 20:`);
        console.log("From:", sender);
        console.log("To Chain:", dstChainId.toString());
        console.log("To Contract:", dstAddress);
        console.log("Data:", data);
        console.log("Nonce:", nonce.toString());
        console.log("Block:", event.blockNumber);

        try {
          console.log("\n📤 Relaying message to Chain 21...");

          const code = await chain2.getBytecode({ address: dstAddress });
          if (!code) {
            console.error(
              `❌ Destination contract not found at ${dstAddress} on Chain 21!`
            );
            continue;
          }

          const isProcessed = await chain2.readContract({
            address: dstAddress,
            abi: [
              {
                name: "processedMessages",
                type: "function",
                inputs: [
                  { name: "srcChainId", type: "uint256" },
                  { name: "nonce", type: "uint256" },
                ],
                outputs: [{ type: "bool" }],
                stateMutability: "view",
              },
            ],
            functionName: "processedMessages",
            args: [BigInt(chainConfig1.id), nonce],
          });

          if (isProcessed) {
            console.log("⚠️ Message already processed, skipping...");
            continue;
          }

          const hash = await wallet.writeContract({
            address: dstAddress,
            abi: [
              {
                name: "receiveMessage",
                type: "function",
                inputs: [
                  { name: "srcAddress", type: "address" },
                  { name: "srcChainId", type: "uint256" },
                  { name: "data", type: "bytes" },
                  { name: "nonce", type: "uint256" },
                ],
                outputs: [],
                stateMutability: "nonpayable",
              },
            ],
            functionName: "receiveMessage",
            args: [sender, BigInt(chainConfig1.id), data, nonce],
          });

          console.log("✅ Message relayed! TX Hash:", hash);

          const receipt = await chain2.waitForTransactionReceipt({ hash });
          console.log(
            "Transaction status:",
            receipt.status ? "Success" : "Failed"
          );
        } catch (error: any) {
          console.error(
            "❌ Error relaying message:",
            error?.message || "Unknown error"
          );
          if (error?.data) console.error("Error data:", error.data);
        }
      }

      from = end + 1n;
    }

    lastProcessedBlock = currentBlock;
  } catch (error: any) {
    console.error(
      "❌ Error processing events:",
      error?.message || "Unknown error"
    );
    if (error?.data) console.error("Error data:", error.data);
  } finally {
    isProcessing = false;
  }
}

// Initialize and start polling
console.log("🔄 Starting event polling...");
initializeBlockNumber().then(() => {
  setInterval(processNewEvents, POLL_INTERVAL);
});
