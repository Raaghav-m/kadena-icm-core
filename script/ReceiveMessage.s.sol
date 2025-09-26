// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../src/ExampleCrossChainApp.sol";

contract ReceiveMessageScript is Script {
    function run() external {
        // Use a different account as the relayer
        uint256 relayerPrivateKey = 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d;
        
        // Connect to the deployed app on Chain 2
        ExampleCrossChainApp appChain2 = ExampleCrossChainApp(0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0);
        
        vm.startBroadcast(relayerPrivateKey);
        
        // Receive the message on Chain 2
        string memory message = "Hello from Chain 1!";
        uint256 srcChainId = 31337; // Chain 1's chainId
        uint256 nonce = 0; // The nonce from the sent message
        bytes memory encodedMessage = abi.encode(message);
        
        console.log("Receiving message on Chain 2...");
        console.log("Source Chain ID:", srcChainId);
        console.log("Nonce:", nonce);
        console.log("Message:", message);
        
        appChain2.handleReceivedMessage(srcChainId, encodedMessage, nonce);
        console.log("Message received and processed!");
        
        vm.stopBroadcast();
    }
} 