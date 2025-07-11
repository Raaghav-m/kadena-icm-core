import {
  Pact,
  createClient,
  createSignWithKeypair,
  isSignedTransaction,
} from '@kadena/client';
import type { ChainId, ICommand } from '@kadena/client';

// === CONFIG ===
const HOST = 'http://localhost:8080';
const NETWORK_ID = 'development';
const CHAIN_ID: ChainId = '0';

// IMPORTANT: replace with your devnet keypair (same as used for deployment)
const PUBLIC_KEY = '463e266f3e8668f8348adc3fd16e3d5101958ea1a479e9849d5ee341018e19b5';
const SECRET_KEY = '7fb0cf532274f347b4f9afd1b1c7bf0492203add7a1d6e1787f5bea4e76caefb';
const SENDER_ACCOUNT = 'trial3'; // account that holds the balance

const client = createClient(
  `${HOST}/chainweb/0.0/${NETWORK_ID}/chain/${CHAIN_ID}/pact`,
);

async function writeName(name: string) {
  const unsigned = Pact.builder
    .execution(`(free.helloWorld-mod.say-hello-to "${name}")`)
    .addSigner(PUBLIC_KEY, (withCap) => [withCap('coin.GAS')])
    .setMeta({
      chainId: CHAIN_ID,
      gasLimit: 5000,
      gasPrice: 0.0000001,
      senderAccount: SENDER_ACCOUNT,
    })
    .setNetworkId(NETWORK_ID)
    .createTransaction();

  const sign = createSignWithKeypair({ publicKey: PUBLIC_KEY, secretKey: SECRET_KEY });
  const signed = (await sign(unsigned)) as ICommand;
  if (!isSignedTransaction(signed)) throw new Error('Signing failed');

  console.log('Submitting write transaction...');
  const desc = await client.submit(signed);
  const res = await client.listen(desc);
  console.log(JSON.stringify(res, null, 2));
}

async function readGreeting() {
  const unsigned = Pact.builder
    .execution('(free.helloWorld-mod.greet)')
    .setMeta({ chainId: CHAIN_ID })
    .setNetworkId(NETWORK_ID)
    .createTransaction();

  const res = await client.local(unsigned, {
    preflight: false,
    signatureVerification: false,
  });
  console.log('Greeting:', res.result.status === 'success' ? res.result.data : res.result.error);
}

(async () => {
  const [_, __, action, arg] = process.argv;
  if (action === 'write') {
    if (!arg) {
      console.error('Usage: ts-node interact-hello.ts write <name>');
      process.exit(1);
    }
    await writeName(arg);
  } else if (action === 'read') {
    await readGreeting();
  } else {
    console.log('Usage:');
    console.log('  ts-node interact-hello.ts write <name>   # store name');
    console.log('  ts-node interact-hello.ts read           # read greeting');
  }
})(); 