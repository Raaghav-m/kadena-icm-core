// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IMessageSender {
    event MessageSent(
        address indexed sender,
        uint256 indexed dstChainId,
        address indexed dstAddress,  // Address of the receiving contract
        bytes data,
        uint256 nonce
    );

    function sendMessage(
        uint256 dstChainId,
        address dstAddress,  // Address that should receive the message
        bytes calldata data
    ) external;
} 