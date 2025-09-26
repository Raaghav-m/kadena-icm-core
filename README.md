# Cross-Chain Messaging System

A modular cross-chain messaging system for EVM chains. The system provides base contracts (`MessageSender` and `MessageReceiver`) that can be imported and used in your own contracts for cross-chain communication.

## Features

- Modular design - import and use in your own contracts
- Send messages from one chain to another
- Prevent message replay using nonces
- TypeScript relayer with automatic message forwarding
- Example implementation showing usage patterns

## How to Use in Your Contract

1. Import the base contracts:

```solidity
import "@kadena-hack/src/MessageSender.sol";
import "@kadena-hack/src/MessageReceiver.sol";
// Or using interfaces if you want to interact with existing deployments
import "@kadena-hack/src/interfaces/IMessageSender.sol";
import "@kadena-hack/src/interfaces/IMessageReceiver.sol";
```

2. Use in your contract:

```solidity
// Example contract showing how to use the messaging system
contract YourCrossChainApp {
    IMessageSender public immutable messageSender;
    IMessageReceiver public immutable messageReceiver;

    // Events for your app's specific messages
    event MessageSent(string message, uint256 dstChainId);
    event MessageReceived(string message, uint256 srcChainId);

    constructor(address _messageSender, address _messageReceiver) {
        messageSender = IMessageSender(_messageSender);
        messageReceiver = IMessageReceiver(_messageReceiver);
    }

    // Function to send your app's message to another chain
    function sendCrossChainMessage(uint256 dstChainId, string calldata message) external {
        // Encode your message
        bytes memory data = abi.encode(message);
        // Send via the messaging system
        messageSender.sendMessage(dstChainId, data);
        emit MessageSent(message, dstChainId);
    }

    // Function to handle received messages
    function handleReceivedMessage(uint256 srcChainId, bytes calldata data, uint256 nonce) external {
        // Verify message hasn't been processed
        require(
            !messageReceiver.processedMessages(srcChainId, nonce),
            "Message already processed"
        );

        // Decode your message
        string memory message = abi.decode(data, (string));

        // Process the message in your app
        // ... your logic here ...

        // Mark as processed and emit event
        messageReceiver.receiveMessage(srcChainId, data, nonce);
        emit MessageReceived(message, srcChainId);
    }

    // View function to check if a message was processed
    function isMessageProcessed(uint256 srcChainId, uint256 nonce) external view returns (bool) {
        return messageReceiver.processedMessages(srcChainId, nonce);
    }
}
```

## Project Structure

```
├── src/
│   ├── MessageSender.sol         # Base contract for sending messages
│   ├── MessageReceiver.sol       # Base contract for receiving messages
│   ├── ExampleCrossChainApp.sol  # Example implementation
│   └── interfaces/               # Contract interfaces
│       ├── IMessageSender.sol    # Interface for MessageSender
│       └── IMessageReceiver.sol  # Interface for MessageReceiver
```

## Installation

1. Add to your project:

```bash
forge install Raaghav-m/kadena-hack
```

2. Import in your contracts:

```solidity
import "@kadena-hack/src/MessageSender.sol";
import "@kadena-hack/src/MessageReceiver.sol";
```

## Deployment

1. Deploy base contracts:

```bash
./deploy.sh
```

This deploys `MessageSender` and `MessageReceiver` to both chains.

2. Use the deployed addresses in your contract:

```solidity
// Get addresses from deployments/deployment.json
YourCrossChainApp app = new YourCrossChainApp(
    messageSenderAddress,
    messageReceiverAddress
);
```

## Running the Relayer

The relayer watches for messages and delivers them across chains:

```bash
bun relayer.ts
```

## Example Usage

We provide `ExampleCrossChainApp.sol` as a reference implementation. To test:

1. Deploy contracts:

```bash
./deploy.sh
```

2. Start relayer:

```bash
bun relayer.ts
```

3. Send test message:

```bash
./send-message.sh
```

## Development and Testing

### Running Tests

```bash
forge test
```

### Local Testing

1. Start two local chains:

```bash
# Chain 1
anvil --port 8545
# Chain 2
anvil --port 8546
```

2. Follow deployment and testing steps above.

## Security Considerations

- The system uses a simple relayer model
- In production:
  - Add proper validation
  - Use secure bridge mechanisms
  - Implement proper error handling
  - Add retry mechanisms
  - Use secure key management

## License

MIT
