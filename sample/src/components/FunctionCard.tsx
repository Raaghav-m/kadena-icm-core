import React, { useState } from 'react';
import { callContract } from '@/utils/callFunction';
import type contractConfig from '@/utils/helloWorld.json';

export type ContractFunction = typeof contractConfig.functions[number];

interface Props {
  fn: ContractFunction;
  accountRef: React.RefObject<string>;
}

const FunctionCard: React.FC<Props> = ({ fn, accountRef }) => {
  const [inputs, setInputs] = useState<string[]>([]);

  const handleInput = (index: number, value: string) => {
    const arr = [...inputs];
    arr[index] = value;
    setInputs(arr);
    console.log('[input]', fn.name, 'arg', index, ':', value);
  };

  const onCall = async () => {
    const account = accountRef.current?.trim() || '';
    console.log('[call]', fn.name, 'inputs:', inputs, 'account:', account);

    if (!account) {
      alert('Please enter an account first');
      return;
    }
    try {
      const capsArr = (fn as any).caps ?? [];
      const res = await callContract(fn.name, inputs, fn.type as 'read' | 'write', account, capsArr);
      console.log('[result]', res);
      alert(JSON.stringify(res));
    } catch (err: any) {
      console.error('[error]', err);
      alert(err.message);
    }
  };

  return (
    <div
      style={{
        border: '1px solid #ccc',
        borderRadius: '6px',
        padding: '1rem',
        minWidth: '220px',
        background: '#f9f9f9',
      }}
    >
      <strong>{fn.name}</strong>&nbsp;
      <span style={{ color: '#555' }}>({fn.type})</span>
      {(fn as any).caps?.length ? (
        <div style={{ fontSize: '0.75rem', color: '#b00', marginTop: '0.25rem' }}>
          requires: {(fn as any).caps.join(', ')}
        </div>
      ) : null}
      {fn.args.map((a, idx) => (
        <input
          key={idx}
          type="text"
          placeholder={a.name}
          value={inputs[idx] || ''}
          onChange={(e) => handleInput(idx, e.target.value)}
          style={{
            display: 'block',
            marginTop: '0.5rem',
            width: '100%',
            padding: '0.4rem',
            fontSize: '0.95rem',
            borderRadius: '4px',
            border: '1px solid #ddd',
          }}
        />
      ))}
      <button
        style={{
          marginTop: '0.8rem',
          padding: '0.5rem',
          width: '100%',
          backgroundColor: '#28a745',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
        }}
        onClick={onCall}
      >
        Call
      </button>
    </div>
  );
};

export default FunctionCard; 