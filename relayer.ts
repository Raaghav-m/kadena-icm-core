import {
  createPublicClient,
  createWalletClient,
  http,
  parseAbiItem,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";

// Configuration
const CHAIN1_RPC = "http://localhost:8545";
const CHAIN2_RPC = "http://localhost:8546";
const PRIVATE_KEY =
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80" as const;
const POLL_INTERVAL = 2000; // Poll every 2 seconds

// Chain configuration
const chainConfig1 = {
  id: 31337,
  name: "Local Chain",
  nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: [CHAIN1_RPC] } },
} as const;

const chainConfig2 = {
  id: 31337,
  name: "Local Chain",
  nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: [CHAIN2_RPC] } },
} as const;

// Contract addresses
const CHAIN1 = {
  messageSender: "0x5FbDB2315678afecb367f032d93F642f64180aa3" as const,
  messageReceiver: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512" as const,
};

const CHAIN2 = {
  messageSender: "0x5FbDB2315678afecb367f032d93F642f64180aa3" as const,
  messageReceiver: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512" as const,
};

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

console.log("\n=== Simple Cross-Chain Relayer ===");
console.log("Watching Chain 1:", CHAIN1_RPC);
console.log("Relaying to Chain 2:", CHAIN2_RPC);
console.log("Relayer Address:", account.address);
console.log("\nContract Addresses:");
console.log("Chain 1:");
console.log("- MessageSender:", CHAIN1.messageSender);
console.log("Chain 2:");
console.log("- MessageReceiver:", CHAIN2.messageReceiver);
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
    const events = await chain1.getLogs({
      address: CHAIN1.messageSender,
      event: parseAbiItem(
        "event MessageSent(address indexed sender, uint256 indexed dstChainId, bytes data, uint256 nonce)"
      ),
      fromBlock: lastProcessedBlock + 1n,
      toBlock: currentBlock,
    });

    if (events.length > 0) {
      console.log("📨 Found", events.length, "new messages");
    }

    // Process each event
    for (const event of events) {
      if (
        !event.args?.dstChainId ||
        !event.args?.data ||
        !event.args?.nonce ||
        !event.args?.sender
      ) {
        console.log("⚠️ Skipping event with missing args");
        continue;
      }

      const { sender, dstChainId, data, nonce } = event.args;

      console.log("\n🔔 New message detected on Chain 1:");
      console.log("From:", sender);
      console.log("To Chain:", dstChainId.toString());
      console.log("Data:", data);
      console.log("Nonce:", nonce.toString());
      console.log("Block:", event.blockNumber);

      try {
        // Send to Chain 2
        console.log("\n📤 Relaying message to Chain 2...");

        // First check if the receiver contract exists
        const code = await chain2.getBytecode({
          address: CHAIN2.messageReceiver,
        });
        if (!code) {
          console.error("❌ MessageReceiver contract not found on Chain 2!");
          continue;
        }

        // Check if message was already processed
        const isProcessed = await chain2.readContract({
          address: CHAIN2.messageReceiver,
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
          address: CHAIN2.messageReceiver,
          abi: [
            {
              name: "receiveMessage",
              type: "function",
              inputs: [
                { name: "srcChainId", type: "uint256" },
                { name: "data", type: "bytes" },
                { name: "nonce", type: "uint256" },
              ],
              outputs: [],
              stateMutability: "nonpayable",
            },
          ],
          functionName: "receiveMessage",
          args: [BigInt(1), data, nonce],
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
