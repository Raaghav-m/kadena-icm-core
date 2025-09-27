// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "./interfaces/IMessageSender.sol";

contract NFTSender is ERC721URIStorage {
    // The cross-chain messaging contract
    IMessageSender public immutable messageSender;
    
    // Counter for minting NFTs
    uint256 private _nextTokenId;

    constructor(address _messageSender) ERC721("CrossChainNFT", "CCNFT") {
        messageSender = IMessageSender(_messageSender);
    }

    // Mint a new NFT with metadata
    function mint(string calldata tokenURI) external {
        uint256 tokenId = _nextTokenId++;
        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, tokenURI);
    }

    // Send NFT to another chain
    function sendNFT(
        uint256 tokenId,
        uint256 dstChainId,
        address dstContract,
        address to
    ) external {
        // Verify ownership
        require(ownerOf(tokenId) == msg.sender, "Not token owner");
        
        // Get the token URI before burning
        string memory tokenURI = tokenURI(tokenId);
        
        // Burn the NFT on this chain
        _burn(tokenId);
        
        // Encode the transfer data: (tokenId, original owner, recipient, tokenURI)
        bytes memory data = abi.encode(tokenId, msg.sender, to, tokenURI);
        
        // Send the cross-chain message
        messageSender.sendMessage(dstChainId, dstContract, data);
    }
}
