import contractConfig from '@/utils/helloWorld.json';
import FunctionCard from '@/components/FunctionCard';
import Head from 'next/head';
import React, { useState, useRef } from 'react';

const Home: React.FC = (): JSX.Element => {
  const accountRef = useRef<string>('');          // ①
  const [account, setAccount] = useState<string>('');

  // Function-specific input handling moved into FunctionCard component

  const handleAccountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAccount(e.target.value);
    accountRef.current = e.target.value;  // ② keep ref in sync
  };

  const handleFaucet = async () => {
    alert(`Faucet requested for account: ${account}`);
    // You can replace this with real faucet logic (e.g. `await fundAccount(account)`)
  };

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', padding: '2rem' }}>
      <Head>
        <title>Kadena App</title>
        <link rel="icon" href="/favicon.png" />
      </Head>

      <h1 style={{ fontSize: '1.8rem', marginBottom: '1rem' }}>Kadena Smart Contract Interface</h1>

      <div style={{ marginBottom: '1.5rem' }}>
        <label htmlFor="account" style={{ fontWeight: 'bold' }}>Account:</label><br />
        <input
          id="account"
          type="text"
          placeholder="Enter account"
          value={account}
          onChange={(e) => {
            setAccount(e.target.value);
            accountRef.current = e.target.value;
          }}
          style={{
            width: '300px',
            padding: '0.5rem',
            fontSize: '1rem',
            marginTop: '0.5rem',
            marginRight: '1rem',
          }}
        />
        <button
          onClick={handleFaucet}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#0070f3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Request Faucet
        </button>
      </div>

      <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Contract Functions</h3>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
        {contractConfig.functions.map((fn) => (
          <FunctionCard key={fn.name} fn={fn} accountRef={accountRef} />
        ))}
      </div>
    </div>
  );
};

export default Home;
