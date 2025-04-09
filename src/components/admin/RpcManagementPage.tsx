
import React, { useState, useEffect } from 'react';
import { RpcStatusCard } from '@/components/admin/RpcStatusCard';
import { RpcConfigDialog } from '@/components/admin/settings/RpcConfigDialog';
import { EthereumRpcStatusCard } from '@/components/admin/EthereumRpcStatusCard';
import { EthereumRpcConfigDialog } from '@/components/admin/settings/EthereumRpcConfigDialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { useRpc } from '@/contexts/RpcContext';

const RpcManagementPage = () => {
  const [activeTab, setActiveTab] = useState('solana');
  const [error, setError] = useState<string | null>(null);
  
  let rpcContext;
  
  try {
    rpcContext = useRpc();
  } catch (err) {
    console.error("Failed to access RPC context:", err);
    setError("Failed to load RPC settings");
  }
  
  const { setPreferredBlockchain } = rpcContext || { setPreferredBlockchain: () => {} };
  
  // Update preferred blockchain when tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    try {
      if (value === 'solana' || value === 'ethereum') {
        setPreferredBlockchain(value);
      }
    } catch (err) {
      console.error("Error changing blockchain preference:", err);
    }
  };

  // Error recovery
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-zinc-100">RPC Connection Management</h1>
      </div>
      
      {error && (
        <Card className="p-4 bg-red-900/20 border-red-800 mb-4">
          <p className="text-red-300">{error}</p>
          <p className="text-sm text-red-400 mt-2">
            Refresh the page or check console for more details.
          </p>
        </Card>
      )}
      
      <Tabs defaultValue="solana" value={activeTab} onValueChange={handleTabChange} className="max-w-3xl">
        <TabsList>
          <TabsTrigger value="solana">Solana RPC</TabsTrigger>
          <TabsTrigger value="ethereum">Ethereum RPC</TabsTrigger>
        </TabsList>
        
        <TabsContent value="solana" className="space-y-4">
          <div className="mb-6">
            <p className="text-zinc-400 mb-4">
              Configure and monitor your Solana RPC connection. Using a private RPC endpoint 
              is recommended for better performance and reliability.
            </p>
          </div>
          
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 text-zinc-100">Solana Connection Status</h2>
            <RpcStatusCard tabId="solana" />
          </div>
        </TabsContent>
        
        <TabsContent value="ethereum" className="space-y-4">
          <div className="mb-6">
            <p className="text-zinc-400 mb-4">
              Configure and monitor your Ethereum RPC connection. A private RPC endpoint
              improves token pricing accuracy and reduces errors during Ethereum transactions.
            </p>
          </div>
          
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 text-zinc-100">Ethereum Connection Status</h2>
            <EthereumRpcStatusCard />
          </div>
          
          <Card className="p-4 text-sm">
            <h3 className="font-medium mb-2 text-zinc-100">Setting up your Ethereum RPC</h3>
            <p className="mb-3 text-zinc-300">
              We recommend using Alchemy for the best performance and reliability. Create a free account
              at <a href="https://alchemy.com/" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:underline">Alchemy</a> and set up an Ethereum app.
            </p>
            <ul className="list-disc list-inside space-y-1 text-zinc-400">
              <li>For mainnet: Use your app's API key in the Alchemy configuration</li>
              <li>For testnet: Create a separate Sepolia testnet app</li>
              <li>Alchemy offers generous free tier limits for development</li>
              <li>Alternative providers: Infura, QuickNode, or your own node</li>
            </ul>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RpcManagementPage;
