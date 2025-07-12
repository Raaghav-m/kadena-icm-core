import fs from 'fs';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import {
  Pact,
  createClient,
  createSignWithKeypair,
  isSignedTransaction,
} from '@kadena/client';
import type { ChainId } from '@kadena/client';

// ----- CLI options -----
const argv = yargs(hideBin(process.argv))
  .option('account', { describe: 'KDA account name', demandOption: true, type: 'string' })
  .option('msg', {
    describe: 'Message to write',
    default: 'hey there',
    type: 'string',
  })
  .option('pub', { describe: 'Sender public key', demandOption: true, type: 'string' })
  .option('priv', { describe: 'Sender secret key', demandOption: true, type: 'string' })
  .option('host', { describe: 'Chainweb node', default: 'http://localhost:8080', type: 'string' })
  .option('network', { describe: 'Network id', default: 'development', type: 'string' })
  .option('chain', { describe: 'Chain id', default: '0', type: 'string' })
  .strict()
  .help().argv as any;

// ----- Load ABI to know namespace/module -----
interface ModuleConfig {
  namespace: string;
  module: string;
}
const cfg: ModuleConfig = JSON.parse(fs.readFileSync('helloWorld.json', 'utf-8'));
const MODULE_Q = `${cfg.namespace}.${cfg.module}`;

(async () => {
  const { account, msg, pub, priv, host, network, chain } = argv as {
    account: string;
    msg: string;
    pub: string;
    priv: string;
    host: string;
    network: string;
    chain: ChainId;
  };

  const code = `(${MODULE_Q}.write-message \"${account}\" \"${msg}\")`;

  const unsigned = Pact.builder
    .execution(code)
    .addSigner(pub, (withCapability) => [
      withCapability('coin.GAS'),
      withCapability(`${MODULE_Q}.ACCOUNT-OWNER`, account),
    ])    .setMeta({ chainId: chain, senderAccount: account, gasLimit: 25000, gasPrice: 0.0000001 })
    .setNetworkId(network)
    .createTransaction();

  const signed = await createSignWithKeypair({ publicKey: pub, secretKey: priv })(unsigned);
  if (!isSignedTransaction(signed)) {
    console.error('Signing failed');
    process.exit(1);
  }

  const client = createClient(`${host}/chainweb/0.0/${network}/chain/${chain}/pact`);
  console.log('Submitting write-message tx...');
  const reqKey = await client.submit(signed);
  const res = await client.listen(reqKey);
  console.log(JSON.stringify(res, null, 2));
})(); 