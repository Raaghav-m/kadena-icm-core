// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./interfaces/IMessageSender.sol";
import "./interfaces/IMessageReceiver.sol";

contract ExampleCrossChainApp {
    IMessageSender public immutable messageSender;
    IMessageReceiver public immutable messageReceiver;
    event CrossChainMessageSent(string message, uint256 dstChainId);
    event CrossChainMessageReceived(string message, uint256 srcChainId);
    event MessageResult(string message, uint256 srcChainId, address relayer);
    
    constructor(address _messageSender, address _messageReceiver) {
        messageSender = IMessageSender(_messageSender);
        messageReceiver = IMessageReceiver(_messageReceiver);
    }
    
    // Function to send a message to another chain
    function sendCrossChainMessage(uint256 dstChainId, string calldata message) external {
        bytes memory data = abi.encode(message);
        messageSender.sendMessage(dstChainId, data);
        emit CrossChainMessageSent(message, dstChainId);
    }
    
    // Function to handle received messages
    function handleReceivedMessage(uint256 srcChainId, bytes calldata data, uint256 nonce) external {
        // Process the message
        string memory message = abi.decode(data, (string));
        
        // Forward to the message receiver contract
        messageReceiver.receiveMessage(srcChainId, data, nonce);
        
        emit CrossChainMessageReceived(message, srcChainId);
        // Emit a detailed result event
        emit MessageResult(
            string(abi.encodePacked("Received message: '", message, "' from Chain ", uint2str(srcChainId))),
            srcChainId,
            msg.sender
        );
    }
    
    // View function to check if a message was processed
    function isMessageProcessed(uint256 srcChainId, uint256 nonce) external view returns (bool) {
        return messageReceiver.processedMessages(srcChainId, nonce);
    }
    
    // View function to get the current nonce
    function getCurrentNonce() external view returns (uint256) {
        return messageSender.nonce();
    }
    
    // Helper function to convert uint to string
    function uint2str(uint256 _i) internal pure returns (string memory str) {
        if (_i == 0) {
            return "0";
        }
        uint256 j = _i;
        uint256 length;
        while (j != 0) {
            length++;
            j /= 10;
        }
        bytes memory bstr = new bytes(length);
        uint256 k = length;
        j = _i;
        while (j != 0) {
            bstr[--k] = bytes1(uint8(48 + j % 10));
            j /= 10;
        }
        str = string(bstr);
    }
} 