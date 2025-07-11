import fs from 'fs';
import path from 'path';
import {
  Pact,
  createClient,
  createSignWithKeypair,
  isSignedTransaction,
} from '@kadena/client';
import type { ChainId, ICommand, ICommandResult } from '@kadena/client';

/*
 * Deployment script for helloWorld.pact to a local devnet (port 8080).
 *
 * Usage: ts-node deploy-hello.ts 
 */

// === CONFIGURATION ===
const PACT_FILE = 'helloWorld.pact';
const HOST = 'http://localhost:8080';
const NETWORK_ID = 'development';
const CHAIN_ID: ChainId = '0';

// Replace these with the keypair that owns the `senderAccount` and will pay gas
const PUBLIC_KEY = '463e266f3e8668f8348adc3fd16e3d5101958ea1a479e9849d5ee341018e19b5';
const SECRET_KEY = '7fb0cf532274f347b4f9afd1b1c7bf0492203add7a1d6e1787f5bea4e76caefb'; // WARNING: For dev use only!
const SENDER_ACCOUNT = `trial3`;

async function main(): Promise<ICommandResult | void> {
  const contractCode = fs.readFileSync(path.resolve(PACT_FILE), 'utf-8');

  const unsignedTx = Pact.builder
    .execution(contractCode)
    .addSigner(PUBLIC_KEY, (withCap) => [withCap('coin.GAS')])
    .setMeta({
      chainId: CHAIN_ID,
      gasLimit: 5000,
      gasPrice: 0.0000001,
      senderAccount: SENDER_ACCOUNT,
    })
    .setNetworkId(NETWORK_ID)
    .createTransaction();

  // Sign locally with the dev keypair
  const signWithKeypair = createSignWithKeypair({
    publicKey: PUBLIC_KEY,
    secretKey: SECRET_KEY,
  });

  const signedTx = (await signWithKeypair(unsignedTx)) as ICommand;
  if (!isSignedTransaction(signedTx)) throw new Error('Signing failed');

  const client = createClient(
    `${HOST}/chainweb/0.0/${NETWORK_ID}/chain/${CHAIN_ID}/pact`,
  );

  console.log('Submitting transaction...');
  const txDescriptor = await client.submit(signedTx);
  console.log('Tx submitted. Listening for result...');
  const result = await client.listen(txDescriptor);

  if (result.result.status === 'success') {
    console.log('Contract deployed successfully!');
  } else {
    console.error('Deployment failed:', result.result.error);
  }

  return result;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
}); 