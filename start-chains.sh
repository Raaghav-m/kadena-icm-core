#!/bin/bash

# Function to kill processes using a port
kill_port() {
    local port=$1
    local pid=$(lsof -ti :$port)
    if [ ! -z "$pid" ]; then
        echo "Killing process using port $port (PID: $pid)"
        kill -9 $pid 2>/dev/null || true
    fi
}

# Kill any existing processes
echo "Cleaning up existing processes..."
pkill -f anvil
pkill -f "bun relayer.ts"
kill_port 8545
kill_port 8546
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

# Start the relayer
echo -e "\nStarting relayer..."
bun relayer.ts &
RELAYER_PID=$!

# Function to cleanup processes on exit
cleanup() {
    echo -e "\nShutting down..."
    kill $CHAIN1_PID $CHAIN2_PID $RELAYER_PID 2>/dev/null || true
    exit 0
}

# Register cleanup function
trap cleanup SIGINT SIGTERM

# Send a test message
echo -e "\nSending test message..."
sleep 2
forge script script/SendMessage.s.sol --rpc-url http://localhost:8545 --broadcast

# Keep script running and show relayer output
echo -e "\nSetup complete! Watching for cross-chain messages..."
echo -e "Press Ctrl+C to stop all processes.\n"

# Keep the script running
wait 