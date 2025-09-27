#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Private key for testing
PRIVATE_KEY="0xb7b00c1254db5fc6e025606c78ff1803c9b452d6194822fbef7b0d6762e617f5"

# Chain RPC URLs
CHAIN1_RPC="https://evm-testnet.chainweb.com/chainweb/0.0/evm-testnet/chain/20/evm/rpc"
CHAIN2_RPC="https://evm-testnet.chainweb.com/chainweb/0.0/evm-testnet/chain/21/evm/rpc"

echo -e "${BLUE}Deploying contracts...${NC}"

# Deploy MessageSender on Chain 1
# echo -e "\n${GREEN}Deploying MessageSender on Chain 1...${NC}"
# MSG_SENDER=$(forge create src/MessageSender.sol:MessageSender \
#     --rpc-url $CHAIN1_RPC \
#     --private-key $PRIVATE_KEY --broadcast --legacy)
# MSG_SENDER_ADDR=$(echo "$MSG_SENDER" | grep "Deployed to:" | awk '{print $3}')
# echo "MessageSender deployed to: $MSG_SENDER_ADDR"

# # Deploy NFTSender on Chain 1
# echo -e "\n${GREEN}Deploying NFTSender on Chain 1...${NC}"
# NFT_SENDER=$(forge create src/NFTSender.sol:NFTSender \
#     --rpc-url $CHAIN1_RPC --broadcast --legacy \
#     --private-key $PRIVATE_KEY \
#     --constructor-args $MSG_SENDER_ADDR )
# NFT_SENDER_ADDR=$(echo "$NFT_SENDER" | grep "Deployed to:" | awk '{print $3}')
# echo "NFTSender deployed to: $NFT_SENDER_ADDR"

# # Deploy NFTReceiver on Chain 2
# echo -e "\n${GREEN}Deploying NFTReceiver on Chain 2...${NC}"
# NFT_RECEIVER=$(forge create src/NFTReceiver.sol:NFTReceiver \
#     --rpc-url $CHAIN2_RPC \
#     --private-key $PRIVATE_KEY --broadcast --legacy)
# NFT_RECEIVER_ADDR=$(echo "$NFT_RECEIVER" | grep "Deployed to:" | awk '{print $3}')
# echo "NFTReceiver deployed to: $NFT_RECEIVER_ADDR"

MSG_SENDER_ADDR="0x31f1bDB782e971256C2aEC2a29A6DfeD13F91DF6"
NFT_SENDER_ADDR="0x932A74CfD47820EB63540eDF02CEBe7ca58D72CE"
NFT_RECEIVER_ADDR="0x31f1bDB782e971256C2aEC2a29A6DfeD13F91DF6"


# Save contract addresses for future use
echo -e "\n${GREEN}Saving contract addresses...${NC}"
cat > contract-addresses.json << EOF
{
    "messageSender": "$MSG_SENDER_ADDR",
    "nftSender": "$NFT_SENDER_ADDR",
    "nftReceiver": "$NFT_RECEIVER_ADDR"
}
EOF

echo -e "\n${BLUE}Testing NFT cross-chain transfer...${NC}"

# Mint an NFT on Chain 1
echo -e "\n${GREEN}Minting NFT on Chain 1...${NC}"
cast send --rpc-url $CHAIN1_RPC \
    --private-key $PRIVATE_KEY \
    $NFT_SENDER_ADDR \
    "mint(string)" \
    "https://example.com/nft/1" \
    --legacy    

# Get the token URI of the minted NFT
echo -e "\n${GREEN}Getting token URI of minted NFT...${NC}"
cast call --rpc-url $CHAIN1_RPC \
    $NFT_SENDER_ADDR \
    "tokenURI(uint256)" \
    0 \
    --legacy

# Send NFT to Chain 2
echo -e "\n${GREEN}Sending NFT to Chain 2...${NC}"
cast send --rpc-url $CHAIN1_RPC \
    --private-key $PRIVATE_KEY \
    $NFT_SENDER_ADDR \
    "sendNFT(uint256,uint256,address,address)" \
    0 \
    5921 \
    $NFT_RECEIVER_ADDR \
    "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266" \
    --legacy

# Wait for relayer to process
echo -e "\n${GREEN}Waiting for relayer to process (10 seconds)...${NC}"
sleep 20

# Verify NFT on Chain 2
echo -e "\n${GREEN}Verifying NFT on Chain 2...${NC}"
cast call --rpc-url $CHAIN2_RPC \
    $NFT_RECEIVER_ADDR \
    "tokenURI(uint256)" \
    0 \
    --legacy

echo -e "\n${BLUE}Deployment and testing complete!${NC}"
echo "Contract addresses have been saved to contract-addresses.json" 