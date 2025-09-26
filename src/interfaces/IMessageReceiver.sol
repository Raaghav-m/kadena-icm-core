// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IMessageReceiver {
    /**
     * @dev Called by the messenger contract to deliver a cross-chain message
     * @param srcChainId The source chain ID where the message originated
     * @param sender The address that sent the message on the source chain
     * @param message The message data
     * @param nonce The message nonce for replay protection
     */
    function receiveMessage(
        uint256 srcChainId,
        address sender,
        bytes calldata message,
        uint256 nonce
    ) external;
} 