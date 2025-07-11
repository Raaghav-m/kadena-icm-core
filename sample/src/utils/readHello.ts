import { Pact, createClient } from '@kadena/client';
import { API_HOST, CHAIN_ID, NETWORK_ID } from './constsLocal';

export default async function readHello(): Promise<string> {
  const unsigned = Pact.builder
    .execution('(free.helloWorld-mod.greet)')
    .setMeta({ chainId: CHAIN_ID })
    .setNetworkId(NETWORK_ID)
    .createTransaction();

  const client = createClient(API_HOST);
  const res = await client.local(unsigned, {
    preflight: false,
    signatureVerification: false,
  });

  if (res.result.status === 'success') {
    return res.result.data.toString();
  }
  throw new Error(res.result.error?.toString() || 'Failed');
} 