"use client";

import contractConfig from '@/utils/helloWorld.json';
import { callContract } from '@/utils/callFunction';
import Head from 'next/head';
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, User, Wallet, CheckCircle, XCircle } from 'lucide-react';

type ContractFunction = typeof contractConfig.functions[number];

const Home: React.FC = (): JSX.Element => {
  const [account, setAccount] = useState<string>('');
  const [nameToWrite, setNameToWrite] = useState<string>('');
  const [greetingFromChain, setGreetingFromChain] = useState<string>('');
  const [writeInProgress, setWriteInProgress] = useState<boolean>(false);
  const [fnInputs, setFnInputs] = useState<Record<string, string[]>>({});
  
  // New state for account management
  const [connectedAccount, setConnectedAccount] = useState<string>('k:1234567890abcdef1234567890abcdef12345678');
  const [chainId, setChainId] = useState<string>('1');
  const [alias, setAlias] = useState<string>('mainnet01');
  const [accountDetails, setAccountDetails] = useState<string>('');
  const [faucetStatus, setFaucetStatus] = useState<string>('');
  const [checkingAccount, setCheckingAccount] = useState<boolean>(false);
  const [requestingFaucet, setRequestingFaucet] = useState<boolean>(false);

  const handleAccountInputChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ): void => {
    setAccount(event.target.value);
  };

  const handleNameInputChange = (
    event: React.ChangeEvent<HTMLTextAreaElement>,
  ): void => {
    setNameToWrite(event.target.value);
  };

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
      const res = await callContract(fn.name, inputs, fn.type as 'read' | 'write', connectedAccount);
      alert(JSON.stringify(res));
    } catch (e: any) {
      alert(e.message);
    }
  };

  // New functions for account management
  const checkAccount = async () => {
    setCheckingAccount(true);
    setAccountDetails('');
    try {
      // Call contract function to check account details
      const result = await callContract('get-account', [connectedAccount], 'read', connectedAccount);
      setAccountDetails(JSON.stringify(result, null, 2));
    } catch (error: any) {
      setAccountDetails(`Error: ${error.message}`);
    } finally {
      setCheckingAccount(false);
    }
  };

  const requestFaucet = async () => {
    setRequestingFaucet(true);
    setFaucetStatus('');
    try {
      // Call contract function to request faucet
      const result = await callContract('request-faucet', [connectedAccount], 'write', connectedAccount);
      setFaucetStatus('✅ Faucet request successful!');
    } catch (error: any) {
      setFaucetStatus(`❌ Faucet request failed: ${error.message}`);
    } finally {
      setRequestingFaucet(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <Head>
          <title>Create Kadena App: Next template</title>
          <link rel="icon" href="/favicon.png" />
        </Head>

        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Kadena Smart Contract Interface</h1>
          <p className="text-gray-600">Interact with your smart contract functions</p>
        </div>

        {/* Account Management Section */}
        <Card className="bg-white shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Connected Account
            </CardTitle>
            <CardDescription>
              Current wallet connection details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Connected Account Display */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-600">Account Address</Label>
                <div className="bg-gray-50 border rounded-lg p-3">
                  <code className="text-sm text-gray-800 break-all">{connectedAccount}</code>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-600">Chain ID</Label>
                <div className="bg-gray-50 border rounded-lg p-3">
                  <code className="text-sm text-gray-800">{chainId}</code>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-600">Network Alias</Label>
                <div className="bg-gray-50 border rounded-lg p-3">
                  <code className="text-sm text-gray-800">{alias}</code>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-4">
              <Button
                onClick={checkAccount}
                disabled={checkingAccount}
                className="flex items-center gap-2"
                variant="outline"
              >
                {checkingAccount ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4" />
                )}
                Check Account Details
              </Button>

              <Button
                onClick={requestFaucet}
                disabled={requestingFaucet}
                className="flex items-center gap-2"
              >
                {requestingFaucet ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Wallet className="h-4 w-4" />
                )}
                Request Faucet
              </Button>
            </div>

            {/* Account Details Result */}
            {accountDetails && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Account Details:</Label>
                <div className="bg-gray-50 border rounded-lg p-4">
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap overflow-x-auto">
                    {accountDetails}
                  </pre>
                </div>
              </div>
            )}

            {/* Faucet Status */}
            {faucetStatus && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Faucet Status:</Label>
                <div className={`p-3 rounded-lg border ${
                  faucetStatus.includes('✅') 
                    ? 'bg-green-50 border-green-200 text-green-800' 
                    : 'bg-red-50 border-red-200 text-red-800'
                }`}>
                  {faucetStatus}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Contract Functions Section */}
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Contract Functions</h2>
            <p className="text-gray-600">Call functions on your smart contract</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {contractConfig.functions.map((fn) => (
              <Card key={fn.name} className="bg-white shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{fn.name}</CardTitle>
                    <Badge variant={fn.type === 'read' ? 'secondary' : 'default'}>
                      {fn.type}
                    </Badge>
                  </div>
                  <CardDescription>
                    {fn.type === 'read' ? 'Query data from the contract' : 'Execute a transaction'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Function Arguments */}
                  {fn.args.map((arg, idx) => (
                    <div key={idx} className="space-y-2">
                      <Label htmlFor={`${fn.name}-arg-${idx}`} className="text-sm font-medium">
                        {arg.name}
                      </Label>
                      <Input
                        id={`${fn.name}-arg-${idx}`}
                        type="text"
                        placeholder={`Enter ${arg.name}`}
                        value={fnInputs[fn.name]?.[idx] || ''}
                        onChange={(e) => handleFnInput(fn.name, idx, e.target.value)}
                        className="w-full"
                      />
                    </div>
                  ))}

                  {/* Call Button */}
                  <Button
                    onClick={() => handleCall(fn)}
                    className="w-full mt-4"
                    variant={fn.type === 'read' ? 'outline' : 'default'}
                  >
                    Call {fn.name}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;