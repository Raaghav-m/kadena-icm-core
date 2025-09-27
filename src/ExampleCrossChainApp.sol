// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./interfaces/IMessageReceiver.sol";
import "./MessageSender.sol";

contract ExampleCrossChainApp is IMessageReceiver {
    MessageSender public immutable messageSender;
    string public lastMessage;
    
    // Track processed messages for replay protection
    mapping(uint256 => mapping(uint256 => bool)) public processedMessages;
    
    event MessageSent(string message, uint256 dstChainId, address dstAddress);
    
    constructor(address _messageSender) {
        messageSender = MessageSender(_messageSender);
    }
    
    // Function to send a message to another chain
    function sendCrossChainMessage(
        uint256 dstChainId,
        address dstAddress,  // Address of the receiving contract
        string calldata message
    ) external {
        bytes memory data = abi.encode(message);
        messageSender.sendMessage(dstChainId, dstAddress, data);
        emit MessageSent(message, dstChainId, dstAddress);
    }
    
    // Function that the relayer calls directly
    function receiveMessage(
        address srcAddress,
        uint256 srcChainId,
        bytes calldata data,
        uint256 nonce
    ) external {
        // Prevent replay attacks
        require(!processedMessages[srcChainId][nonce], "Message already processed");
        processedMessages[srcChainId][nonce] = true;
        
        // Decode and store the message
        lastMessage = abi.decode(data, (string));
        
        // Emit event
        emit MessageReceived(srcAddress, srcChainId, data, nonce);
    }
} 