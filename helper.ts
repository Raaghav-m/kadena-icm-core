import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import {
  Pact,
  createClient,
  isSignedTransaction,
} from '@kadena/client';
import type { ChainId } from '@kadena/client';

const argv = yargs(hideBin(process.argv))
  .option('account', { demandOption: true, type: 'string', describe: 'KDA account name' })
  .option('host', { default: 'http://localhost:8080', type: 'string', describe: 'Chainweb node URL' })
  .option('network', { default: 'development', type: 'string', describe: 'Network ID' })
  .option('chain', { default: '0', type: 'string', describe: 'Chain ID' })
  .strict()
  .help().argv as any;

(async () => {
  const { account, host, network, chain } = argv as {
    account: string;
    host: string;
    network: string;
    chain: ChainId;
  };

  const client = createClient(`${host}/chainweb/0.0/${network}/chain/${chain}/pact`);
  const pactCode = `(coin.details "${account}")`;

  const res = await client.local(
    Pact.builder
      .execution(pactCode)
      .setMeta({
        chainId: chain,
        senderAccount: account,
        gasLimit: 10000,
        gasPrice: 0.0000001,
        ttl: 600,
      })
      .setNetworkId(network)
      .createTransaction()
  );

  if (res.result.status === 'success') {
    const data = res.result.data;
if (typeof data === 'object' && data !== null && 'guard' in data) {
  console.log(`🔐 Guard for ${account}:`);
  console.log(JSON.stringify(data.guard, null, 2));
} else {
  console.error(`❌ Unexpected result or account not found:\n`, data);
}
  } else {
    console.error('❌ Failed to retrieve keyset:', res.result);
  }
})();
