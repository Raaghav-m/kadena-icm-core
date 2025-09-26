// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../src/MessageSender.sol";
import "../src/MessageReceiver.sol";
import "../src/ExampleCrossChainApp.sol";

contract DeployLocalScript is Script {
    function run() external {
        // Use the first Anvil account
        uint256 deployerPrivateKey = 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy MessageSender
        MessageSender messageSender = new MessageSender();
        console.log("MessageSender deployed to:", address(messageSender));
        
        // Deploy MessageReceiver
        MessageReceiver messageReceiver = new MessageReceiver();
        console.log("MessageReceiver deployed to:", address(messageReceiver));
        
        // Deploy ExampleCrossChainApp
        ExampleCrossChainApp app = new ExampleCrossChainApp(
            address(messageSender),
            address(messageReceiver)
        );
        console.log("ExampleCrossChainApp deployed to:", address(app));
        
        vm.stopBroadcast();
    }
} 