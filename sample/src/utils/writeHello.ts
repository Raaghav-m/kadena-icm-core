import type { ICommandResult, ChainId } from '@kadena/client';
import {
  Pact,
  createClient,
  isSignedTransaction,
  createSignWithKeypair,
} from '@kadena/client';
import {
  API_HOST,
  CHAIN_ID,
  NETWORK_ID,
  DEV_PUB_KEY,
  DEV_PRIVATE_KEY,
} from './constsLocal';

interface WriteHelloParams {
  account: string; // sender account (alias or k:pubkey)
  name: string; // name to store
}

export default async function writeHello({
  account,
  name,
}: WriteHelloParams): Promise<ICommandResult> {
  const signerPubKey = account.includes(':') ? account.split(':')[1] : DEV_PUB_KEY;

  const unsignedTx = Pact.builder
    .execution(`(free.helloWorld-mod.say-hello-to \"${name}\")`)
    .addSigner(signerPubKey, (withCap) => [withCap('coin.GAS')])
    .setMeta({ chainId: CHAIN_ID as ChainId, senderAccount: account })
    .setNetworkId(NETWORK_ID)
    .createTransaction();

  // Sign automatically using dev keypair
  const signWithKeypair = createSignWithKeypair({
    publicKey: signerPubKey,
    secretKey: DEV_PRIVATE_KEY,
  });
  const signedTx = await signWithKeypair(unsignedTx);

  const client = createClient(API_HOST);
  if (isSignedTransaction(signedTx)) {
    const desc = await client.submit(signedTx);
    return client.listen(desc);
  }
  throw new Error('Failed to sign transaction');
} 