// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IMessageReceiver {
    event MessageReceived(
        address indexed srcAddress,
        uint256 srcChainId,
        bytes data,
        uint256 nonce
    );

    function receiveMessage(
        address srcAddress,
        uint256 srcChainId,
        bytes calldata data,
        uint256 nonce
    ) external;

    function processedMessages(uint256 chainId, uint256 nonce) external view returns (bool);
} 