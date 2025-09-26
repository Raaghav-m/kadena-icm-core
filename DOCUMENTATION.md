# Cross-Chain NFT Bridge Documentation

This project implements a cross-chain NFT bridge that allows transferring NFTs and their metadata between different blockchain networks. The implementation uses a simple message passing protocol with a relayer to facilitate cross-chain communication.

## Architecture

The system consists of three main components:

1. **NFTSender Contract** (Chain 1)

   - Mints NFTs with metadata
   - Burns NFTs when sending cross-chain
   - Sends cross-chain messages via MessageSender

2. **NFTReceiver Contract** (Chain 2)

   - Receives cross-chain messages
   - Mints NFTs with original metadata
   - Handles token ID collisions intelligently

3. **Relayer**
   - Monitors Chain 1 for MessageSent events
   - Relays messages to Chain 2
   - Ensures message delivery and handles retries

## Prerequisites

- Node.js and yarn
- Foundry (forge, anvil, cast)
- Two EVM chains (local or testnet)

## Setup

1. **Install Dependencies**

```bash
# Install Node.js dependencies
yarn install

# Install Forge dependencies
forge install
```

2. **Start Local Chains**

```bash
# Terminal 1 - Chain 1 (Port 8545)
anvil --port 8545

# Terminal 2 - Chain 2 (Port 8546)
anvil --port 8546
```

3. **Start Relayer**

```bash
# Terminal 3
ts-node relayer.ts
```

## Deployment and Testing

The project includes a comprehensive deployment and testing script:

```bash
# Deploy contracts and run test flow
./deploy-and-test.sh
```

This script will:

1. Deploy all contracts
2. Save contract addresses to contract-addresses.json
3. Mint a test NFT
4. Transfer it cross-chain
5. Verify the transfer

## Contract Details

### NFTSender

- ERC721 contract with metadata support
- Functions:
  - `mint(string calldata tokenURI)`: Mint new NFT with metadata
  - `sendNFT(uint256 tokenId, uint256 dstChainId, address dstContract, address to)`: Send NFT to another chain
  - `tokenURI(uint256 tokenId)`: Get NFT metadata URI

### NFTReceiver

- ERC721 contract with metadata support
- Functions:
  - `receiveMessage(address srcAddress, uint256 srcChainId, bytes calldata data, uint256 nonce)`: Receive cross-chain NFT
  - `tokenURI(uint256 tokenId)`: Get NFT metadata URI
  - `getLocalTokenId(uint256 sourceTokenId)`: Map source chain token IDs to local IDs

### MessageSender

- Cross-chain messaging contract
- Functions:
  - `sendMessage(uint256 dstChainId, address dstAddress, bytes calldata data)`: Send cross-chain message

## Usage Examples

### 1. Mint and Transfer NFT

```bash
# Mint NFT with metadata
cast send --rpc-url http://127.0.0.1:8545 \
    --private-key YOUR_PRIVATE_KEY \
    $NFT_SENDER_ADDR \
    "mint(string)" \
    "https://example.com/nft/1"

# Send NFT to Chain 2
cast send --rpc-url http://127.0.0.1:8545 \
    --private-key YOUR_PRIVATE_KEY \
    $NFT_SENDER_ADDR \
    "sendNFT(uint256,uint256,address,address)" \
    0 31337 $NFT_RECEIVER_ADDR RECIPIENT_ADDRESS
```

### 2. Verify NFT on Chain 2

```bash
# Get token URI
cast call --rpc-url http://127.0.0.1:8546 \
    $NFT_RECEIVER_ADDR \
    "tokenURI(uint256)" \
    0
```

## Token ID Management

The NFTReceiver contract implements intelligent token ID management:

1. Tries to use the original token ID from the source chain
2. If there's a collision, assigns the next available token ID
3. Maintains a mapping between source and local token IDs

## Security Considerations

1. **Message Replay Protection**

   - Each message has a unique nonce
   - Processed messages are tracked to prevent replays

2. **Token ID Collisions**

   - Handled automatically by NFTReceiver
   - Original token IDs are preserved when possible
   - Mapping maintained for traceability

3. **Metadata Integrity**
   - Metadata URI is transferred with the NFT
   - Original ownership information is preserved

## Development and Testing

### Local Development

1. Make code changes
2. Run tests: `forge test`
3. Deploy locally using deploy-and-test.sh
4. Monitor relayer logs for issues

### Adding New Features

1. Modify contracts in src/
2. Update relayer.ts if needed
3. Update deployment script
4. Add new tests

## Troubleshooting

### Common Issues

1. **Relayer Not Processing Messages**

   - Check if relayer is running
   - Verify chain RPC URLs
   - Check contract addresses in relayer config

2. **Token ID Mismatch**

   - Use getLocalTokenId() to find correct local ID
   - Check if token was already minted

3. **Transaction Failures**
   - Verify gas settings
   - Check contract addresses
   - Ensure proper private keys

### Debug Tools

1. **View Contract State**

```bash
# Check processed messages
cast call $NFT_RECEIVER_ADDR "processedMessages(uint256,uint256)" CHAIN_ID NONCE

# Check token ownership
cast call $NFT_SENDER_ADDR "ownerOf(uint256)" TOKEN_ID
```

2. **Monitor Events**

```bash
# Watch for MessageSent events
cast logs --rpc-url http://127.0.0.1:8545 $MSG_SENDER_ADDR
```

## Future Improvements

1. **Scalability**

   - Batch transfers
   - Gas optimization
   - Multiple relayers

2. **Security**

   - Multi-sig ownership
   - Time locks
   - Emergency pause

3. **Features**
   - Bulk transfers
   - NFT collections
   - Metadata verification
