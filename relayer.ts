import {
  createPublicClient,
  createWalletClient,
  http,
  decodeEventLog,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";

// Configuration
const CHAIN1_RPC =
  "https://evm-testnet.chainweb.com/chainweb/0.0/evm-testnet/chain/20/evm/rpc";
const CHAIN2_RPC =
  "https://evm-testnet.chainweb.com/chainweb/0.0/evm-testnet/chain/21/evm/rpc";
const PRIVATE_KEY =
  "0xb7b00c1254db5fc6e025606c78ff1803c9b452d6194822fbef7b0d6762e617f5" as const;
const POLL_INTERVAL = 2000; // Poll every 2 seconds

// Chain configuration
const chainConfig1 = {
  id: 5920,
  name: "Kadena Testnet 1",
  nativeCurrency: { name: "KDA", symbol: "KDA", decimals: 18 },
  rpcUrls: { default: { http: [CHAIN1_RPC] } },
} as const;

const chainConfig2 = {
  id: 5921,
  name: "Kadena Testnet 2",
  nativeCurrency: { name: "KDA", symbol: "KDA", decimals: 18 },
  rpcUrls: { default: { http: [CHAIN2_RPC] } },
} as const;

// Contract addresses - we only need the MessageSender address on Chain 1
const CHAIN1_SENDER = "0x31f1bDB782e971256C2aEC2a29A6DfeD13F91DF6" as const;

// Event ABI
const messageSentEventAbi = {
  anonymous: false,
  inputs: [
    {
      indexed: true,
      internalType: "address",
      name: "sender",
      type: "address",
    },
    {
      indexed: true,
      internalType: "uint256",
      name: "dstChainId",
      type: "uint256",
    },
    {
      indexed: true,
      internalType: "address",
      name: "dstAddress",
      type: "address",
    },
    {
      indexed: false,
      internalType: "bytes",
      name: "data",
      type: "bytes",
    },
    {
      indexed: false,
      internalType: "uint256",
      name: "nonce",
      type: "uint256",
    },
  ],
  name: "MessageSent",
  type: "event",
} as const;

// Create clients
const chain1 = createPublicClient({
  transport: http(CHAIN1_RPC),
  chain: chainConfig1,
});

const chain2 = createPublicClient({
  transport: http(CHAIN2_RPC),
  chain: chainConfig2,
});

const account = privateKeyToAccount(PRIVATE_KEY);
const wallet = createWalletClient({
  account,
  transport: http(CHAIN2_RPC),
  chain: chainConfig2,
});

// Maximum blocks per RPC request
const MAX_BLOCK_RANGE = 100_000n;

// Function to get logs in chunks to avoid RPC limits
async function getLogsInChunks(fromBlock: bigint, toBlock: bigint) {
  let logs: any[] = [];
  let start = fromBlock;

  while (start <= toBlock) {
    const end =
      start + MAX_BLOCK_RANGE - 1n > toBlock
        ? toBlock
        : start + MAX_BLOCK_RANGE - 1n;

    const chunkLogs = await chain1.getLogs({
      address: CHAIN1_SENDER,
      events: [messageSentEventAbi],
      fromBlock: start,
      toBlock: end,
    });

    logs = logs.concat(chunkLogs);
    start = end + 1n;
  }

  return logs;
}

console.log("\n=== Simple Cross-Chain Relayer ===");
console.log("Watching Chain 1:", CHAIN1_RPC);
console.log("Relaying to Chain 2:", CHAIN2_RPC);
console.log("Relayer Address:", account.address);
console.log("\nWatching MessageSender:", CHAIN1_SENDER);
console.log("================================\n");

// Keep track of the last block we processed
let lastProcessedBlock = 0n;
let isProcessing = false;
let heartbeatCount = 0;

// Function to process new events
async function processNewEvents() {
  // Skip if already processing
  if (isProcessing) {
    return;
  }

  try {
    isProcessing = true;
    heartbeatCount++;

    // Print heartbeat every 10 intervals
    if (heartbeatCount % 10 === 0) {
      console.log("💓 Relayer heartbeat...");
    }

    // Get current block
    const currentBlock = await chain1.getBlockNumber();

    // Skip if no new blocks
    if (currentBlock <= lastProcessedBlock) {
      isProcessing = false;
      return;
    }

    console.log(
      "\n🔍 Checking blocks",
      lastProcessedBlock.toString(),
      "to",
      currentBlock.toString()
    );

    // Get events from last processed block to current
    const logs = await getLogsInChunks(lastProcessedBlock + 1n, currentBlock);

    if (logs.length > 0) {
      console.log("📨 Found", logs.length, "new messages");
    }

    // Process each event
    for (const log of logs) {
      try {
        const event = decodeEventLog({
          abi: [messageSentEventAbi],
          data: log.data,
          topics: log.topics,
        });

        const { sender, dstChainId, dstAddress, data, nonce } = event.args;

        console.log("\n🔔 New message detected on Chain 1:");
        console.log("From:", sender);
        console.log("To Chain:", dstChainId.toString());
        console.log("To Contract:", dstAddress);
        console.log("Data:", data);
        console.log("Nonce:", nonce.toString());
        console.log("Block:", log.blockNumber);

        // Send to Chain 2
        console.log("\n📤 Relaying message to Chain 2...");

        // First check if the destination contract exists
        const code = await chain2.getBytecode({
          address: dstAddress,
        });
        if (!code) {
          console.error(
            `❌ Destination contract not found at ${dstAddress} on Chain 2!`
          );
          continue;
        }

        // Check if message was already processed
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
          args: [BigInt(1), nonce],
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
          args: [sender, BigInt(1), data, nonce],
          chain: chainConfig2,
        });

        console.log("✅ Message relayed! TX Hash:", hash);

        // Wait for receipt
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
        if (error?.data) {
          console.error("Error data:", error.data);
        }
      }
    }

    // Update last processed block
    lastProcessedBlock = currentBlock;
  } catch (error: any) {
    console.error(
      "❌ Error processing events:",
      error?.message || "Unknown error"
    );
    if (error?.data) {
      console.error("Error data:", error.data);
    }
  } finally {
    isProcessing = false;
  }
}

// Start polling
console.log("🔄 Starting event polling...");
setInterval(processNewEvents, POLL_INTERVAL);

// Also call immediately
processNewEvents();
