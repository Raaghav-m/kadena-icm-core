import { Pact, createClient } from '@kadena/client';

const ACCOUNT = 'trial3';
const CHAIN_ID = '0';
const NETWORK_ID = 'development';
const client = createClient(`http://localhost:8080/chainweb/0.0/${NETWORK_ID}/chain/${CHAIN_ID}/pact`);

(async () => {
  const unsigned = Pact.builder
    .execution(`(coin.details "${ACCOUNT}")`)
    .setMeta({ chainId: CHAIN_ID })
    .setNetworkId(NETWORK_ID)
    .createTransaction();

  const res = await client.local(unsigned, {
    preflight: false,
    signatureVerification: false,
  });

  console.log(JSON.stringify(res.result, null, 2));
})();
