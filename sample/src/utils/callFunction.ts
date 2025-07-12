import { Pact, createClient, isSignedTransaction, createSignWithKeypair } from '@kadena/client';
import { API_HOST, CHAIN_ID, NETWORK_ID, DEV_PUB_KEY, DEV_PRIVATE_KEY } from './constsLocal';
import contractConfig from './helloWorld.json';

const MODULE_QUALIFIED = `${contractConfig.namespace}.${contractConfig.module}`;

export async function callContract(
  fnName: string,
  args: string[],
  type: 'read' | 'write',
  account: string,
): Promise<any> {
  const argList = args.map((a) => (isNaN(Number(a)) ? `\"${a}\"` : a)).join(' ');
  const code = `(${MODULE_QUALIFIED}.${fnName}${argList ? ' ' + argList : ''})`;

  if (type === 'read') {
    const unsigned = Pact.builder
      .execution(code)
      .setMeta({ chainId: CHAIN_ID })
      .setNetworkId(NETWORK_ID)
      .createTransaction();
    const client = createClient(API_HOST);
    const res = await client.local(unsigned, { preflight: false, signatureVerification: false });
    if (res.result.status === 'success') return res.result.data;
    throw res.result.error;
  }
  // write
  const pub =DEV_PUB_KEY;
  console.log(account);
  const unsigned = Pact.builder
    .execution(code)
    .addSigner(pub, (withCap) => [
      withCap('coin.GAS'),
      withCap(`${MODULE_QUALIFIED}.ACCOUNT-OWNER`, account),
    ])
    .setMeta({ chainId: CHAIN_ID, senderAccount: account })
    .setNetworkId(NETWORK_ID)
    .createTransaction();
  console.log(unsigned);
  const signer = createSignWithKeypair({ publicKey: pub, secretKey: DEV_PRIVATE_KEY });
  const signed = await signer(unsigned);
  if (!isSignedTransaction(signed)) throw new Error('sign failed');
  const client = createClient(API_HOST);
  const desc = await client.submit(signed);
  const res = await client.listen(desc);
  if (res.result.status === 'success') return res.result.data;
  throw res.result.error;
} 