import fs from 'fs';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { Pact, createClient } from '@kadena/client';
import type { ChainId } from '@kadena/client';

// CLI options
const argv = yargs(hideBin(process.argv))
  .option('account', { describe: 'KDA account name', demandOption: true, type: 'string' })
  .option('host', { describe: 'Chainweb node', default: 'http://localhost:8080', type: 'string' })
  .option('network', { describe: 'Network id', default: 'development', type: 'string' })
  .option('chain', { describe: 'Chain id', default: '0', type: 'string' })
  .strict()
  .help().argv as any;

// Load ABI to build module name
interface ModuleConfig {
  namespace: string;
  module: string;
}
const cfg: ModuleConfig = JSON.parse(fs.readFileSync('helloWorld.json', 'utf-8'));
const MODULE_Q = `${cfg.namespace}.${cfg.module}`;

(async () => {
  const { account, host, network, chain } = argv as {
    account: string;
    host: string;
    network: string;
    chain: ChainId;
  };

  const code = `(${MODULE_Q}.read-message \"${account}\")`;

  const unsigned = Pact.builder
    .execution(code)
    .setMeta({ chainId: chain })
    .setNetworkId(network)
    .createTransaction();

  const client = createClient(`${host}/chainweb/0.0/${network}/chain/${chain}/pact`);
  const res = await client.dirtyRead(unsigned);
  if (res.result.status === 'success') {
    console.log('Message:', res.result.data);
  } else {
    console.error('Error:', res.result.error);
  }
})(); 