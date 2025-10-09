import {
  Pact,
  createClient,
  createSignWithKeypair,
  isSignedTransaction,
} from '@kadena/client';
import { API_HOST, CHAIN_ID, NETWORK_ID } from './constsLocal';
import contractConfig from './contractConfig.json';

const MODULE_QUALIFIED = `${contractConfig.namespace}.${contractConfig.module}`;

// Get keys from environment variables (browser-accessible for testing)
const DEV_PUB_KEY = process.env.NEXT_PUBLIC_DEV_PUB_KEY;
const DEV_PRIVATE_KEY = process.env.NEXT_PUBLIC_DEV_PRIVATE_KEY;

if (!DEV_PUB_KEY || !DEV_PRIVATE_KEY) {
  throw new Error(
    'NEXT_PUBLIC_DEV_PUB_KEY and NEXT_PUBLIC_DEV_PRIVATE_KEY environment variables must be set',
  );
}

function formatPactArg(value: string, type: string): string {
  // Handle array types like [string], [integer], etc.
  if (type.startsWith('[')) {
    // Parse comma-separated values
    const items = value
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
    
    // Determine the inner type (e.g., "string" from "[string]")
    const innerType = type.slice(1, -1); // Remove [ and ]
    
    // Format each item based on inner type
    const formattedItems = items.map((item) => {
      if (innerType === 'string') {
        return `"${item}"`;
      } else if (innerType === 'integer' || innerType === 'decimal') {
        return item;
      } else {
        // Default: treat as string
        return `"${item}"`;
      }
    });
    
    return `[${formattedItems.join(' ')}]`;
  }
  
  // Handle non-array types
  if (type === 'integer' || type === 'decimal') {
    return value;
  }
  
  // Default: treat as string
  return `"${value}"`;
}

export async function callContract(
  fnName: string,
  args: string[],
  argTypes: string[],
  type: 'read' | 'write',
  account: string,
  caps: string[] = [],
): Promise<any> {
  console.log('[callContract] fnName:', fnName);
  console.log('[callContract] args array:', args);
  console.log('[callContract] args length:', args.length);
  console.log('[callContract] argTypes:', argTypes);
  
  const argList = args
    .map((arg, idx) => formatPactArg(arg, argTypes[idx] || 'string'))
    .join(' ');
  const code = `(${MODULE_QUALIFIED}.${fnName}${argList ? ' ' + argList : ''})`;
  
  console.log('[callContract] formatted argList:', argList);
  console.log('[callContract] final Pact code:', code);

  if (type === 'read') {
    const unsigned = Pact.builder
      .execution(code)
      .setMeta({ chainId: CHAIN_ID,gasLimit: 4000000000 })
      .setNetworkId(NETWORK_ID)
      .createTransaction();
    const client = createClient(API_HOST);
    const res = await client.local(unsigned, {
      preflight: false,
      signatureVerification: false,
    });
    if (res.result.status === 'success') return res.result.data;
    throw res.result.error;
  }
  // write
  const pub = DEV_PUB_KEY!; // Assert it's not undefined since we checked above
  console.log(account);
  const unsigned = Pact.builder
    .execution(code)
    .addSigner(pub, (withCap) => {
      const list = [withCap('coin.GAS')];
      for (const c of caps) {
        if (c === 'ACCOUNT-OWNER') {
          list.push(withCap(`${MODULE_QUALIFIED}.ACCOUNT-OWNER`, account));
        } else if (c.includes('.')) {
          list.push(withCap(c));
        } else {
          list.push(withCap(`${MODULE_QUALIFIED}.${c}`));
        }
      }
      return list;
    })
    .setMeta({
      chainId: CHAIN_ID,
      senderAccount: account,
      gasLimit: 150000,
    })
    .setNetworkId(NETWORK_ID)
    .createTransaction();
  console.log(unsigned);
  const signer = createSignWithKeypair({
    publicKey: pub,
    secretKey: DEV_PRIVATE_KEY!, // Assert it's not undefined since we checked above
  });
  const signed = await signer(unsigned);
  if (!isSignedTransaction(signed)) throw new Error('sign failed');
  const client = createClient(API_HOST);
  const desc = await client.submit(signed);
  const res = await client.listen(desc);
  if (res.result.status === 'success') return res.result.data;
  throw res.result.error;
}
