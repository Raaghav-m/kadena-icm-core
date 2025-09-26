# Cross-Chain Messaging System

A simple cross-chain messaging system for EVM chains using Foundry and TypeScript. The system allows sending messages between two chains with a relayer that ensures message delivery.

## Features

- Send messages from one chain to another
- Prevent message replay using nonces
- TypeScript relayer with automatic message forwarding
- Example cross-chain application showing how to use the messaging system
- Simple deployment and testing scripts

## Prerequisites

- [Foundry](https://book.getfoundry.sh/getting-started/installation)
- [Bun](https://bun.sh/) for TypeScript/JavaScript

## Project Structure

```
├── src/
│   ├── MessageSender.sol         # Contract for sending messages
│   ├── MessageReceiver.sol       # Contract for receiving messages
│   ├── ExampleCrossChainApp.sol  # Example application using the messaging system
│   └── interfaces/               # Contract interfaces
├── script/
│   └── DeployOnce.s.sol         # Deployment script
├── test/
│   └── CrossChainMessaging.t.sol # Test cases
├── deploy.sh                     # Deployment shell script
├── send-message.sh              # Script to send test messages
└── relayer.ts                   # TypeScript relayer
```

## Quick Start

1. Install dependencies:

```bash
# Install Foundry dependencies
forge install
# Install TypeScript dependencies
bun install
```

2. Start two local chains (in separate terminals):

```bash
# Chain 1 (port 8545)
anvil --port 8545

# Chain 2 (port 8546)
anvil --port 8546
```

3. Deploy contracts to both chains:

```bash
./deploy.sh
```

This will deploy all contracts to both chains and save the addresses in `deployments/deployment.json`.

4. Start the relayer:

```bash
bun relayer.ts
```

The relayer will watch for messages on Chain 1 and forward them to Chain 2.

5. Send a test message:

```bash
./send-message.sh
```

This will send "hello world" from Chain 1 to Chain 2.

## Contract Details

### MessageSender

- Emits `MessageSent` events when a message is sent
- Maintains a nonce for message ordering
- Interface: `IMessageSender`

### MessageReceiver

- Receives and processes messages from other chains
- Prevents message replay using nonces
- Interface: `IMessageReceiver`

### ExampleCrossChainApp

- Shows how to use the messaging system in your application
- Sends and receives string messages between chains
- Emits events for message tracking

## Scripts

### deploy.sh

Deploys all contracts to both chains:

- MessageSender
- MessageReceiver
- ExampleCrossChainApp

### send-message.sh

Sends a test message and verifies its receipt:

1. Sends "hello world" from Chain 1 to Chain 2
2. Waits for relayer processing
3. Verifies message receipt on Chain 2

### relayer.ts

Watches for messages and relays them:

- Monitors Chain 1 for `MessageSent` events
- Forwards messages to Chain 2
- Includes replay protection
- Provides detailed logging

## Development

### Running Tests

```bash
forge test
```

### Custom Message Format

To send custom messages, modify `send-message.sh`:

```bash
cast send $CHAIN1_APP \
  "sendCrossChainMessage(uint256,string)" \
  2 "your message" \
  --rpc-url http://localhost:8545 \
  --private-key YOUR_PRIVATE_KEY
```

### Custom Chain Configuration

For different chains, update the RPC URLs and chain IDs in:

- `deploy.sh`
- `send-message.sh`
- `relayer.ts`

## Security Considerations

- The system uses a simple relayer model without additional security measures
- In production, add proper validation, multi-sig, or bridge security
- Private keys in scripts are for local testing only
- Add proper error handling and retry mechanisms for production use

## License

MIT
