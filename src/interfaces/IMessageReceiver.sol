// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IMessageReceiver {
    /**
     * @dev Emitted when a cross-chain message is received and processed
     * @param srcAddress Original sender address from source chain
     * @param srcChainId Source chain ID where the message originated
     * @param data Message payload data
     * @param nonce Message nonce for replay protection
     */
    event MessageReceived(
        address indexed srcAddress,  // Original sender from source chain
        uint256 srcChainId,         // Source chain ID
        bytes data,                 // Message data
        uint256 nonce              // Message nonce for replay protection
    );

    /**
     * @dev Function called by the relayer to deliver cross-chain messages
     * @param srcAddress Original sender address from source chain
     * @param srcChainId Source chain ID where the message originated
     * @param data Message payload data
     * @param nonce Message nonce used for replay protection
     */
    function receiveMessage(
        address srcAddress,
        uint256 srcChainId,
        bytes calldata data,
        uint256 nonce
    ) external;

    /**
     * @dev Check if a message has already been processed
     * @param chainId Source chain ID of the message
     * @param nonce Message nonce
     * @return bool True if message has been processed, false otherwise
     */
    function processedMessages(uint256 chainId, uint256 nonce) external view returns (bool);
} 