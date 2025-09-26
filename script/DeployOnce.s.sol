// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../src/MessageSender.sol";
import "../src/MessageReceiver.sol";
import "../src/ExampleCrossChainApp.sol";

contract DeployOnceScript is Script {
    function run() external {
        // Load or use default private key
            // Use first Anvil test account if no private key provided
         console.log("Deploying contracts...");
         uint256 deployerPrivateKey = 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;

        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy contracts
        MessageSender messageSender = new MessageSender();
        MessageReceiver messageReceiver = new MessageReceiver();
        ExampleCrossChainApp app = new ExampleCrossChainApp(
            address(messageSender),
            address(messageReceiver)
        );
        
        // Log addresses
        console.log("\nDeployed Contract Addresses:");
        console.log("MessageSender:", address(messageSender));
        console.log("MessageReceiver:", address(messageReceiver));
        console.log("ExampleCrossChainApp:", address(app));
        
        // Create JSON string manually
        string memory json = string(
            abi.encodePacked(
                '{"Contracts":{"messageSender":"', addressToString(address(messageSender)),
                '","messageReceiver":"', addressToString(address(messageReceiver)),
                '","exampleApp":"', addressToString(address(app)), '"}}'
            )
        );
        
        // Save to different files based on chain
        string memory chainId = vm.toString(block.chainid);
        string memory filename = string.concat("deployments/chain_", chainId, ".json");
        vm.writeFile(filename, json);
        
        console.log("\nAddresses saved to:", filename);
        
        vm.stopBroadcast();
    }

    // Helper function to convert address to string
    function addressToString(address _addr) internal pure returns (string memory) {
        bytes memory s = new bytes(42);
        s[0] = "0";
        s[1] = "x";
        bytes memory b = abi.encodePacked(_addr);
        for (uint i = 0; i < 20; i++) {
            uint8 hi = uint8(b[i]) >> 4;
            uint8 lo = uint8(b[i]) & 0x0f;
            s[2 + i * 2] = char(hi);
            s[2 + i * 2 + 1] = char(lo);
        }
        return string(s);
    }

    // Helper function to convert byte to char
    function char(uint8 b) internal pure returns (bytes1) {
        if (b < 10) return bytes1(b + 0x30);
        else return bytes1(b + 0x57);
    }
} 