// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "./interfaces/IMessageReceiver.sol";

contract NFTReceiver is ERC721URIStorage, IMessageReceiver {
    // Track processed messages to prevent replay
    mapping(uint256 => mapping(uint256 => bool)) public processedMessages;
    
    // Counter for next available token ID
    uint256 private _nextTokenId;
    
    // Mapping to track original token IDs from source chain
    mapping(uint256 => uint256) public sourceToLocalTokenId;
    
    constructor() ERC721("CrossChainNFT", "CCNFT") {
        _nextTokenId = 1; // Start from 1 to avoid using 0
    }

    // Get the local token ID for a source chain token ID
    function getLocalTokenId(uint256 sourceTokenId) public view returns (uint256) {
        uint256 localId = sourceToLocalTokenId[sourceTokenId];
        require(localId != 0, "Token not found");
        return localId;
    }

    // Receive cross-chain message and mint NFT
    function receiveMessage(
        address srcAddress,
        uint256 srcChainId,
        bytes calldata data,
        uint256 nonce
    ) external {
        // Verify message hasn't been processed
        require(!processedMessages[srcChainId][nonce], "Message already processed");
        
        // Mark message as processed
        processedMessages[srcChainId][nonce] = true;
        
        // Decode the transfer data
        (uint256 sourceTokenId, address originalOwner, address to, string memory tokenURI) = abi.decode(
            data,
            (uint256, address, address, string)
        );
        
        // Check if the desired token ID is available
        uint256 newTokenId;
        if (_exists(sourceTokenId)) {
            // If token ID is taken, use next available ID
            newTokenId = _nextTokenId++;
            while (_exists(newTokenId)) {
                newTokenId = _nextTokenId++;
            }
        } else {
            // If token ID is available, use it
            newTokenId = sourceTokenId;
            // Update next token ID if necessary
            if (newTokenId >= _nextTokenId) {
                _nextTokenId = newTokenId + 1;
            }
        }
        
        // Store the mapping between source and local token IDs
        sourceToLocalTokenId[sourceTokenId] = newTokenId;
        
        // Mint the NFT to the recipient
        _safeMint(to, newTokenId);
        
        // Set the token URI
        _setTokenURI(newTokenId, tokenURI);
        
        // Emit the received event
        emit MessageReceived(srcAddress, srcChainId, data, nonce);
    }
}
