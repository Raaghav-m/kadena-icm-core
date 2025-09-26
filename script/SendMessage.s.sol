 // SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../src/ExampleCrossChainApp.sol";

contract SendMessageScript is Script {
    function run() external {
        // Use the first Anvil account
        uint256 deployerPrivateKey = 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;
        
        // Connect to the deployed app on Chain 1
        ExampleCrossChainApp appChain1 = ExampleCrossChainApp(0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0);
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Send a test message from Chain 1 to Chain 2
        string memory message = "Cross-chain message from Kadena Chain 1 to Chain 2!";
        uint256 dstChainId = 31337; // Chain 2's chainId (local anvil uses same chain ID)
        
        console.log("\n=== Sending Cross-Chain Message ===");
        console.log("From: Chain 1");
        console.log("To: Chain 2");
        console.log("Message:", message);
        console.log("================================");
        
        appChain1.sendCrossChainMessage(dstChainId, message);
        
        uint256 nonce = appChain1.getCurrentNonce() - 1;
        console.log("\nMessage sent with nonce:", nonce);
        console.log("Waiting for relayer to process...\n");
        
        vm.stopBroadcast();
    }
}