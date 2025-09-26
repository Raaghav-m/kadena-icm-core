// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IMessageSender {
    event MessageSent(
        address indexed sender,
        uint256 indexed dstChainId,
        bytes data,
        uint256 nonce
    );
    
    function nonce() external view returns (uint256);
    function sendMessage(uint256 dstChainId, bytes calldata data) external;
} 