// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IMessageReceiver {
    event MessageReceived(
        address indexed relayer,
        uint256 indexed srcChainId,
        bytes data,
        uint256 nonce
    );
    
    function processedMessages(uint256 srcChainId, uint256 nonce) external view returns (bool);
    function receiveMessage(uint256 srcChainId, bytes calldata data, uint256 nonce) external;
} 