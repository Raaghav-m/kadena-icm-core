import { Pact, createClient, isSignedTransaction, createSignWithKeypair } from '@kadena/client';
import { API_HOST, CHAIN_ID, NETWORK_ID, DEV_PUB_KEY, DEV_PRIVATE_KEY } from './constsLocal';

export async function callContract(
  fnName: string,
  args: string[],
  type: 'read' | 'write',
  account: string,
): Promise<any> {
  const argList = args.map((a) => (isNaN(Number(a)) ? `\"${a}\"` : a)).join(' ');
  const code = `(free.hi-module.${fnName} ${argList})`;

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
  const pub = account.includes(':') ? account.split(':')[1] : DEV_PUB_KEY;
  const unsigned = Pact.builder
    .execution(code)
    .addSigner(pub, (withCap) => [withCap('coin.GAS')])
    .setMeta({ chainId: CHAIN_ID, senderAccount: account })
    .setNetworkId(NETWORK_ID)
    .createTransaction();
  const signer = createSignWithKeypair({ publicKey: pub, secretKey: DEV_PRIVATE_KEY });
  const signed = await signer(unsigned);
  if (!isSignedTransaction(signed)) throw new Error('sign failed');
  const client = createClient(API_HOST);
  const desc = await client.submit(signed);
  const res = await client.listen(desc);
  if (res.result.status === 'success') return res.result.data;
  throw res.result.error;
} 