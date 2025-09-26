// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IMessageReceiver {
    event MessageReceived(
        address indexed sender,      // Original sender from source chain
        uint256 indexed srcChainId,  // Source chain ID
        bytes data,                  // Message data
        uint256 nonce               // Message nonce for replay protection
    );

    // Function that the relayer will call directly
    function receiveMessage(
        uint256 srcChainId,
        address srcAddress,  // Original sender address from source chain
        bytes calldata data,
        uint256 nonce
    ) external;
} 