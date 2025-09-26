// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../src/MessageSender.sol";
import "../src/MessageReceiver.sol";
import "../src/ExampleCrossChainApp.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
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