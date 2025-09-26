#!/bin/bash

# Create deployments directory
mkdir -p deployments

# Chain 1 Deployment (port 8545)
echo -e "\n=== Deploying to Chain 1 ==="
# Deploy MessageSender on Chain 1
echo "Deploying MessageSender..."
SENDER1=$(forge create src/MessageSender.sol:MessageSender --rpc-url http://localhost:8545 --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 --broadcast)
SENDER1_ADDRESS=$(echo "$SENDER1" | grep "Deployed to:" | awk '{print $3}')

# Deploy MessageReceiver on Chain 1
echo "Deploying MessageReceiver..."
RECEIVER1=$(forge create src/MessageReceiver.sol:MessageReceiver --rpc-url http://localhost:8545 --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 --broadcast)
RECEIVER1_ADDRESS=$(echo "$RECEIVER1" | grep "Deployed to:" | awk '{print $3}')

# Deploy ExampleCrossChainApp on Chain 1
echo "Deploying ExampleCrossChainApp..."
APP1=$(forge create src/ExampleCrossChainApp.sol:ExampleCrossChainApp --broadcast --rpc-url http://localhost:8545 --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 --constructor-args $SENDER1_ADDRESS $RECEIVER1_ADDRESS)
APP1_ADDRESS=$(echo "$APP1" | grep "Deployed to:" | awk '{print $3}')

# Chain 2 Deployment (port 8546)
echo -e "\n=== Deploying to Chain 2 ==="
# Deploy MessageSender on Chain 2
echo "Deploying MessageSender..."
SENDER2=$(forge create src/MessageSender.sol:MessageSender --broadcast --rpc-url http://localhost:8546 --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80)
SENDER2_ADDRESS=$(echo "$SENDER2" | grep "Deployed to:" | awk '{print $3}')

# Deploy MessageReceiver on Chain 2
echo "Deploying MessageReceiver..."
RECEIVER2=$(forge create src/MessageReceiver.sol:MessageReceiver --broadcast --rpc-url http://localhost:8546 --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80)
RECEIVER2_ADDRESS=$(echo "$RECEIVER2" | grep "Deployed to:" | awk '{print $3}')

# Deploy ExampleCrossChainApp on Chain 2
echo "Deploying ExampleCrossChainApp..."
APP2=$(forge create src/ExampleCrossChainApp.sol:ExampleCrossChainApp --broadcast --rpc-url http://localhost:8546 --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 --constructor-args $SENDER2_ADDRESS $RECEIVER2_ADDRESS)
APP2_ADDRESS=$(echo "$APP2" | grep "Deployed to:" | awk '{print $3}')

# Save addresses to JSON
echo "{
  \"chain1\": {
    \"Contracts\": {
      \"messageSender\": \"$SENDER1_ADDRESS\",
      \"messageReceiver\": \"$RECEIVER1_ADDRESS\",
      \"exampleApp\": \"$APP1_ADDRESS\"
    }
  },
  \"chain2\": {
    \"Contracts\": {
      \"messageSender\": \"$SENDER2_ADDRESS\",
      \"messageReceiver\": \"$RECEIVER2_ADDRESS\",
      \"exampleApp\": \"$APP2_ADDRESS\"
    }
  }
}" > deployments/deployment.json

echo -e "\nDeployment complete!"
echo -e "\nChain 1 Addresses:"
echo "MessageSender: $SENDER1_ADDRESS"
echo "MessageReceiver: $RECEIVER1_ADDRESS"
echo "ExampleCrossChainApp: $APP1_ADDRESS"

echo -e "\nChain 2 Addresses:"
echo "MessageSender: $SENDER2_ADDRESS"
echo "MessageReceiver: $RECEIVER2_ADDRESS"
echo "ExampleCrossChainApp: $APP2_ADDRESS"

echo -e "\nAll addresses saved to deployments/deployment.json" 