// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./interfaces/IMessageSender.sol";

contract MessageSender is IMessageSender {
    uint256 public nonce;
    
    function sendMessage(
        uint256 dstChainId,
        address dstAddress,
        bytes calldata data
    ) external {
        emit MessageSent(msg.sender, dstChainId, dstAddress, data, nonce);
        nonce++;
    }
} 