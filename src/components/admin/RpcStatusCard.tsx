
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { getActiveNetwork } from '@/utils/wallet/index';
import { getCustomRpcUrl } from '@/utils/rpc/rpcUtils';
import { useBlockchainType } from '@/contexts/RpcContext';

interface RpcStatusCardProps {
  endpoint?: string;
  tabId?: string;
}

export function RpcStatusCard({ endpoint, tabId }: RpcStatusCardProps) {
  const [status, setStatus] = useState<'checking' | 'online' | 'offline' | 'error'>('checking');
  const [latency, setLatency] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [displayedEndpoint, setDisplayedEndpoint] = useState<string>('');
  
  const activeNetwork = getActiveNetwork();
  // Use the blockchain type from context, with tab awareness
  const blockchain = useBlockchainType(tabId);
  
  useEffect(() => {
    // First try to get the custom RPC URL from localStorage via our utility
    const customRpcUrl = getCustomRpcUrl(activeNetwork === 'mainnet' ? 'mainnet-beta' : 'devnet');
    
    // Use provided endpoint, then custom RPC, then default fallback
    const rpcEndpoint = endpoint || customRpcUrl || (blockchain === 'solana' 
      ? (activeNetwork === 'mainnet' ? 'https://api.mainnet-beta.solana.com' : 'https://api.devnet.solana.com')
      : 'https://ethereum-goerli.publicnode.com');
      
    setDisplayedEndpoint(rpcEndpoint);
    
    const checkRpcStatus = async () => {
      setStatus('checking');
      setLatency(null);
      setErrorMessage(null);
      
      const startTime = performance.now();
      
      try {
        let response;
        
        if (blockchain === 'solana') {
          // Solana RPC request
          response = await fetch(rpcEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              jsonrpc: '2.0',
              id: 1,
              method: 'getHealth',
            }),
          });
        } else {
          // Ethereum RPC request
          response = await fetch(rpcEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              jsonrpc: '2.0',
              id: 1,
              method: 'net_version',
              params: []
            }),
          });
        }
        
        const endTime = performance.now();
        const responseTime = Math.round(endTime - startTime);
        setLatency(responseTime);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // For Solana, check specific response format
        if (blockchain === 'solana' && data.result !== 'ok') {
          setStatus('error');
          setErrorMessage(`Unhealthy RPC: ${data.result || 'Unknown state'}`);
          return;
        }
        
        setStatus('online');
      } catch (error) {
        console.error('RPC check error:', error);
        const endTime = performance.now();
        setLatency(Math.round(endTime - startTime));
        setStatus('offline');
        setErrorMessage(error instanceof Error ? error.message : 'Unable to connect to RPC');
      }
    };
    
    checkRpcStatus();
    
    // Set up interval to check periodically
    const interval = setInterval(checkRpcStatus, 60000); // Every minute
    
    return () => clearInterval(interval);
  }, [endpoint, blockchain, activeNetwork, tabId]);
  
  // Determine status display values
  const getStatusDisplay = () => {
    switch (status) {
      case 'checking':
        return { 
          text: 'Checking...',
          badge: 'default',
          icon: <Loader2 className="h-4 w-4 animate-spin" />
        };
      case 'online':
        return { 
          text: 'Online',
          badge: 'success',
          icon: <CheckCircle2 className="h-4 w-4" />
        };
      case 'offline':
        return { 
          text: 'Offline',
          badge: 'destructive',
          icon: <XCircle className="h-4 w-4" />
        };
      case 'error':
        return { 
          text: 'Error',
          badge: 'warning',
          icon: <AlertCircle className="h-4 w-4" />
        };
    }
  };
  
  const statusDisplay = getStatusDisplay();
  
  return (
    <Card className="shadow-md">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex justify-between items-center">
          RPC Status
          <Badge 
            variant={statusDisplay.badge as any} 
            className="ml-2 flex items-center gap-1"
          >
            {statusDisplay.icon} {statusDisplay.text}
          </Badge>
        </CardTitle>
        <CardDescription className="text-xs truncate">
          {displayedEndpoint}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Network:</span>
            <span className="font-medium">{activeNetwork === 'mainnet' ? 'Mainnet' : 'Testnet'}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Blockchain:</span>
            <span className="font-medium capitalize">{blockchain}</span>
          </div>
          {latency !== null && (
            <div className="flex justify-between text-sm">
              <span>Latency:</span>
              <span className={`font-medium ${latency > 500 ? 'text-amber-500' : latency > 200 ? 'text-emerald-600' : 'text-emerald-500'}`}>
                {latency}ms
              </span>
            </div>
          )}
          {errorMessage && (
            <div className="mt-2 text-xs text-red-500 break-all">
              {errorMessage}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
