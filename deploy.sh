#!/bin/bash

# Create deployments directory
mkdir -p deployments

# Deploy to Chain 1
echo -e "\n=== Deploying to Chain 1 ==="

# Deploy MessageSender
echo "Deploying MessageSender..."
SENDER1=$(forge create src/MessageSender.sol:MessageSender --broadcast --rpc-url http://localhost:8545 --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80)
SENDER1_ADDRESS=$(echo "$SENDER1" | grep "Deployed to:" | awk '{print $3}')

# Deploy ExampleCrossChainApp
echo "Deploying ExampleCrossChainApp..."
APP1=$(forge create src/ExampleCrossChainApp.sol:ExampleCrossChainApp --broadcast --rpc-url http://localhost:8545 --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 --constructor-args $SENDER1_ADDRESS)
APP1_ADDRESS=$(echo "$APP1" | grep "Deployed to:" | awk '{print $3}')

# Deploy to Chain 2
echo -e "\n=== Deploying to Chain 2 ==="

# Deploy MessageSender
echo "Deploying MessageSender..."
SENDER2=$(forge create src/MessageSender.sol:MessageSender --broadcast --rpc-url http://localhost:8546 --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80)
SENDER2_ADDRESS=$(echo "$SENDER2" | grep "Deployed to:" | awk '{print $3}')

# Deploy ExampleCrossChainApp
echo "Deploying ExampleCrossChainApp..."
APP2=$(forge create src/ExampleCrossChainApp.sol:ExampleCrossChainApp --broadcast --rpc-url http://localhost:8546 --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 --constructor-args $SENDER2_ADDRESS)
APP2_ADDRESS=$(echo "$APP2" | grep "Deployed to:" | awk '{print $3}')

# Save addresses to JSON
echo "{
  \"chain1\": {
    \"Contracts\": {
      \"messageSender\": \"$SENDER1_ADDRESS\",
      \"exampleApp\": \"$APP1_ADDRESS\"
    }
  },
  \"chain2\": {
    \"Contracts\": {
      \"messageSender\": \"$SENDER2_ADDRESS\",
      \"exampleApp\": \"$APP2_ADDRESS\"
    }
  }
}" > deployments/deployment.json

echo -e "\nDeployment complete!"
echo -e "\nChain 1 Addresses:"
echo "MessageSender: $SENDER1_ADDRESS"
echo "ExampleCrossChainApp: $APP1_ADDRESS"

echo -e "\nChain 2 Addresses:"
echo "MessageSender: $SENDER2_ADDRESS"
echo "ExampleCrossChainApp: $APP2_ADDRESS"

echo -e "\nAll addresses saved to deployments/deployment.json" 