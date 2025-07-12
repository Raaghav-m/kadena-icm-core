import contractConfig from '@/utils/helloWorld.json';
import { callContract } from '@/utils/callFunction';

type ContractFunction = typeof contractConfig.functions[number];
import Head from 'next/head';
import React, { useState } from 'react';

const Home: React.FC = (): JSX.Element => {
  const [account, setAccount] = useState<string>('');
  const [fnInputs, setFnInputs] = useState<Record<string, string[]>>({});


  const handleFnInput = (fn: string, index: number, value: string) => {
    setFnInputs(prev => {
      const arr = prev[fn] ? [...prev[fn]] : [];
      arr[index] = value;
      return { ...prev, [fn]: arr };
    });
  };

  const handleCall = async (fn: ContractFunction) => {
    try {
      const inputs = fnInputs[fn.name] || [];
      const res = await callContract(fn.name, inputs, fn.type as 'read' | 'write', account);
      alert(JSON.stringify(res));
    } catch (e:any) {
      alert(e.message);
    }
  };

  return (
    <div>
      <h3>Contract Functions</h3>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
        {contractConfig.functions.map((fn) => (
          <div key={fn.name} style={{ border: '1px solid #ccc', padding: '1rem', minWidth: '200px' }}>
            <strong>{fn.name}</strong> &nbsp;({fn.type})
            {fn.args.map((a, idx) => (
              <input
                key={idx}
                type="text"
                placeholder={a.name}
                value={fnInputs[fn.name]?.[idx] || ''}
                onChange={(e) => handleFnInput(fn.name, idx, e.target.value)}
                style={{ display: 'block', marginTop: '0.5rem', width: '100%' }}
              />
            ))}
            <button style={{ marginTop: '0.5rem' }} onClick={() => handleCall(fn)}>
              Call
            </button>
          </div>
        ))}
      </div>
      <Head>
        <title>Create Kadena App: Next template</title>
        <link rel="icon" href="/favicon.png" />
      </Head>
      
    </div>
  );
};

export default Home;
