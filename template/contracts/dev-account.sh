#!/bin/bash
ALIAS=${KADENA_ALIAS:-testing-account}
KEYFILE="$ALIAS.yaml"

npx kadena config init --create-wallet="false" 

if [ ! -f "$KEYFILE" ]; then
 npx kadena key generate --key-alias "$ALIAS" --key-amount 1
fi

PUBKEY=$(grep -m 1 -oE 'publicKey: [0-9a-f]+' "$KEYFILE" | awk '{print $2}')
PRIVKEY=$(grep -m 1 -oE 'secretKey: [0-9a-f]+' "$KEYFILE" | awk '{print $2}')

npx kadena account add --from key --account-alias "$ALIAS" --fungible coin --public-keys "$PUBKEY" --predicate keys-all --quiet || true
npx kadena account fund --account "$ALIAS" --network devnet --chain-ids 0 --amount 20 --deploy-faucet --quiet

echo "Account $ALIAS funded on devnet chain 0 (pubkey: $PUBKEY)."

# Save keys to frontend .env.local
ENV_FILE="../frontend/.env.local"
echo "NEXT_PUBLIC_DEV_PUB_KEY=$PUBKEY" > "$ENV_FILE"
echo "NEXT_PUBLIC_DEV_PRIVATE_KEY=$PRIVKEY" >> "$ENV_FILE"

echo "Keys saved to $ENV_FILE for frontend use."
