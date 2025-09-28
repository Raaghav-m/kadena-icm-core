# Kadena Cross-Chain Examples

Simple examples of cross-chain messaging and NFT transfers on Kadena testnet.

## Contract Addresses

Chain 20:

```
MessageSender: 0x31f1bDB782e971256C2aEC2a29A6DfeD13F91DF6
NFTSender: 0x932A74CfD47820EB63540eDF02CEBe7ca58D72CE
```

Chain 21:

```
MessageSender: 0x0e29239308015DD57e215DF3610B7d9d8231B976
NFTReceiver: 0x098F11AfD4c818B119906D8f46D7DBa9C8058ceb
```

## Examples

### 1. Simple Message Passing

See `src/ExampleCrossChainApp.sol`:

```solidity
// Send message
app.sendCrossChainMessage(
    destChainId,    // Chain ID (5920 or 5921)
    destAddress,    // Receiver contract address
    "Hello Cross Chain!"
);

// Message appears in lastMessage variable on destination chain
string message = app.lastMessage();
```

### 2. Cross-Chain NFT Transfer

See `src/NFTSender.sol` and `src/NFTReceiver.sol`:

```solidity
// On Chain 20: Mint and send
nft.mint("https://your-metadata-uri");
nft.sendNFT(tokenId, 5921, receiverAddress, recipientAddress);

// NFT appears on Chain 21 automatically
```

## Quick Start

1. Run relayers:

```bash
# Chain 20 -> 21
ts-node relayer.ts

# Chain 21 -> 20
ts-node relayer2.ts
```

2. Use the contracts:

```bash
# Set your private key
export PRIVATE_KEY=your_key_here

# Example: Send message from Chain 20 to 21
cast send $EXAMPLE_APP "sendCrossChainMessage(uint256,address,string)" \
    5921 $DEST_ADDRESS "Hello Cross Chain!" \
    --rpc-url https://evm-testnet.chainweb.com/chainweb/0.0/evm-testnet/chain/20/evm/rpc \
    --private-key $PRIVATE_KEY
```

## RPC Endpoints

```
Chain 20: https://evm-testnet.chainweb.com/chainweb/0.0/evm-testnet/chain/20/evm/rpc
Chain 21: https://evm-testnet.chainweb.com/chainweb/0.0/evm-testnet/chain/21/evm/rpc
```
