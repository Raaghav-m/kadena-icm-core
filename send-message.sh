#!/bin/bash

# Load contract addresses from deployment.json
CHAIN1_APP=$(cat deployments/deployment.json | jq -r '.chain1.Contracts.exampleApp')
CHAIN2_APP=$(cat deployments/deployment.json | jq -r '.chain2.Contracts.exampleApp')

echo -e "\n=== Sending Cross-Chain Message ==="
echo "From Chain 1 (8545) to Chain 2 (8546)"
echo "Message: 'hello world'"

# Send message from Chain 1
echo -e "\nSending message from Chain 1..."
cast send $CHAIN1_APP \
  "sendCrossChainMessage(uint256,string)" \
  2 "hello world" \
  --rpc-url http://localhost:8545 \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

# Wait a bit for the relayer to process
echo -e "\nWaiting for relayer to process..."
sleep 5

# Get the nonce from Chain 1
NONCE=$(cast call $CHAIN1_APP "getCurrentNonce()(uint256)" --rpc-url http://localhost:8545)
LAST_NONCE=$((NONCE - 1))

# Check if message was received on Chain 2
echo -e "\nChecking message receipt on Chain 2..."
IS_PROCESSED=$(cast call $CHAIN2_APP "isMessageProcessed(uint256,uint256)(bool)" 1 $LAST_NONCE --rpc-url http://localhost:8546)

if [ "$IS_PROCESSED" = "true" ]; then
    echo "✅ Message successfully processed on Chain 2!"
else
    echo "❌ Message not yet processed on Chain 2. Make sure the relayer is running!"
fi 