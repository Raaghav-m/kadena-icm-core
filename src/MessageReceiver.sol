// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./interfaces/IMessageReceiver.sol";

contract MessageReceiver is IMessageReceiver {
    // srcChainId => nonce => processed
    mapping(uint256 => mapping(uint256 => bool)) public processedMessages;
    
    function receiveMessage(
        uint256 srcChainId,
        bytes calldata data,
        uint256 nonce
    ) external {
        require(
            !processedMessages[srcChainId][nonce],
            "Message already processed"
        );
        
        processedMessages[srcChainId][nonce] = true;
        emit MessageReceived(msg.sender, srcChainId, data, nonce);
    }
} 