#!/bin/bash

# Create deployments directory
mkdir -p deployments

# Kill any existing processes
echo "Cleaning up existing processes..."
pkill -f anvil
pkill -f "bun relayer.ts"
sleep 2

# Start Chain 1 (default port 8545)
echo "Starting Chain 1..."
anvil --port 8545 &
CHAIN1_PID=$!

# Start Chain 2 (port 8546)
echo "Starting Chain 2..."
anvil --port 8546 &
CHAIN2_PID=$!

# Wait for chains to start
sleep 2

# Deploy to Chain 1
echo -e "\nDeploying to Chain 1..."
forge script script/DeployOnce.s.sol --rpc-url http://localhost:8545 --broadcast

# Deploy to Chain 2
echo -e "\nDeploying to Chain 2..."
forge script script/DeployOnce.s.sol --rpc-url http://localhost:8546 --broadcast

# Create a combined deployment file for the relayer
echo -e "\nCreating combined deployment file..."
cat > deployments/deployment.json << EOL
{
  "chain1": $(cat deployments/chain_31337.json),
  "chain2": $(cat deployments/chain_31337.json)
}
EOL

echo "Deployment addresses saved to deployments/deployment.json"

# Kill the Anvil instances
kill $CHAIN1_PID $CHAIN2_PID

echo -e "\nDeployment complete! You can now use these addresses in your relayer and tests." 