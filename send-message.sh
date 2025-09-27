#!/bin/bash

# Load contract addresses from deployment.json
CHAIN1_APP=$(cat deployments/deployment.json | jq -r '.chain1.Contracts.exampleApp')
CHAIN2_APP=$(cat deployments/deployment.json | jq -r '.chain2.Contracts.exampleApp')
CHAIN1_SENDER=$(cat deployments/deployment.json | jq -r '.chain1.Contracts.messageSender')

echo "CHAIN1_APP: $CHAIN1_APP"
echo "CHAIN2_APP: $CHAIN2_APP"
echo "CHAIN1_SENDER: $CHAIN1_SENDER"

echo -e "\n=== Sending Cross-Chain Message ==="
echo "From Chain 1 (8545) to Chain 2 (8546)"
echo "From App: $CHAIN1_APP"
echo "To App: $CHAIN2_APP"
echo "Message: 'hey there'"

# Get current nonce before sending
CURRENT_NONCE=$(cast call $CHAIN1_SENDER "nonce()(uint256)" --rpc-url http://localhost:8545)
echo "Current nonce: $CURRENT_NONCE"

# Get required fee
FEE=$(cast call $CHAIN1_SENDER "messageFee()(uint256)" --rpc-url http://localhost:8545)
echo "Required fee: $FEE wei"

# Send message from Chain 1
echo -e "\nSending message from Chain 1..."
TX_HASH=$(cast send $CHAIN1_APP \
  "sendCrossChainMessage(uint256,address,string)" \
  2 \
  $CHAIN2_APP \
  "hey there" \
  --value $FEE \
  --rpc-url http://localhost:8545 \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80)

echo "Transaction sent! Hash: $TX_HASH"

# Wait a bit for the relayer to process
echo -e "\nWaiting for relayer to process..."
sleep 5

# Check if message was received on Chain 2
echo -e "\nChecking message receipt on Chain 2..."
IS_PROCESSED=$(cast call $CHAIN2_APP \
  "processedMessages(uint256,uint256)(bool)" \
  -- 1 $CURRENT_NONCE \
  --rpc-url http://localhost:8546)

if [ "$IS_PROCESSED" = "true" ]; then
    echo "✅ Message successfully processed on Chain 2!"
    
    # Get the last received message
    LAST_MESSAGE=$(cast call $CHAIN2_APP "lastMessage()(string)" --rpc-url http://localhost:8546)
    echo -e "\nLast received message on Chain 2: '$LAST_MESSAGE'"
else
    echo "❌ Message not yet processed on Chain 2. Make sure the relayer is running!"
    
    # Get the contract code to verify it exists
    echo -e "\nChecking contract existence..."
    CODE_LENGTH=$(cast code $CHAIN2_APP --rpc-url http://localhost:8546 | wc -c)
    if [ "$CODE_LENGTH" -eq 0 ]; then
        echo "❌ Error: No contract found at $CHAIN2_APP on Chain 2!"
    else
        echo "✅ Contract exists at $CHAIN2_APP on Chain 2"
    fi
fi 