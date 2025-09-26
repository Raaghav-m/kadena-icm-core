// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "../src/MessageSender.sol";
import "../src/MessageReceiver.sol";
import "../src/ExampleCrossChainApp.sol";

contract CrossChainMessagingTest is Test {
    MessageSender public messageSender;
    MessageReceiver public messageReceiver;
    ExampleCrossChainApp public appChain1;
    ExampleCrossChainApp public appChain2;
    
    address public owner;
    address public relayer;
    
    function setUp() public {
        owner = address(this);
        relayer = address(0x1234);
        
        // Deploy contracts
        messageSender = new MessageSender();
        messageReceiver = new MessageReceiver();
        
        // Deploy example apps
        appChain1 = new ExampleCrossChainApp(
            address(messageSender),
            address(messageReceiver)
        );
        appChain2 = new ExampleCrossChainApp(
            address(messageSender),
            address(messageReceiver)
        );
        
        vm.label(address(messageSender), "MessageSender");
        vm.label(address(messageReceiver), "MessageReceiver");
        vm.label(address(appChain1), "AppChain1");
        vm.label(address(appChain2), "AppChain2");
    }
    
    function testMessageSending() public {
        string memory message = "Hello Cross-Chain!";
        uint256 dstChainId = 2;
        bytes memory encodedMessage = abi.encode(message);
        
        // Send message from Chain 1
        appChain1.sendCrossChainMessage(dstChainId, message);
        
        // Simulate relayer receiving on Chain 2
        vm.startPrank(relayer);
        appChain2.handleReceivedMessage(1, encodedMessage, 0);
        vm.stopPrank();
        
        // Verify message was processed
        assertTrue(appChain2.isMessageProcessed(1, 0));
    }
    
    function testPreventReplayAttacks() public {
        string memory message = "Test Message";
        uint256 dstChainId = 2;
        bytes memory encodedMessage = abi.encode(message);
        
        // Send first message
        appChain1.sendCrossChainMessage(dstChainId, message);
        
        // First receive should succeed
        vm.startPrank(relayer);
        appChain2.handleReceivedMessage(1, encodedMessage, 0);
        
        // Second receive should fail
        vm.expectRevert("Message already processed");
        appChain2.handleReceivedMessage(1, encodedMessage, 0);
        vm.stopPrank();
    }
    
    function testNonceIncrement() public {
        string memory message1 = "First Message";
        string memory message2 = "Second Message";
        uint256 dstChainId = 2;
        
        // Send first message
        appChain1.sendCrossChainMessage(dstChainId, message1);
        assertEq(appChain1.getCurrentNonce(), 1);
        
        // Send second message
        appChain1.sendCrossChainMessage(dstChainId, message2);
        assertEq(appChain1.getCurrentNonce(), 2);
    }
} 