import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, AlertCircle, Gauge, Info } from 'lucide-react';
import { getEthereumRpcInfo, testEthereumRpc } from '@/utils/wallet/ethereum';
import { getEthPrice } from '@/utils/wallet/ethereum';
import { EthereumRpcConfigDialog } from '@/components/admin/settings/EthereumRpcConfigDialog';
import { logDebug } from '@/utils/debugLogging';
import { toast } from 'sonner';
import { useRpc } from '@/contexts/RpcContext';

export function EthereumRpcStatusCard() {
  const { activeNetwork, setActiveNetwork } = useRpc();
  const [isLoading, setIsLoading] = useState(true);
  const [rpcStatus, setRpcStatus] = useState<{
    type: 'alchemy' | 'custom' | 'public';
    isHealthy: boolean;
    url: string | null;
    responseTime?: number;
  }>({
    type: 'public',
    isHealthy: false,
    url: null,
  });
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [totalRequests, setTotalRequests] = useState(0);
  const [networkType, setNetworkType] = useState<'mainnet' | 'testnet'>(activeNetwork);
  const [ethPrice, setEthPrice] = useState<number | null>(null);

  // Sync network type with context
  useEffect(() => {
    setNetworkType(activeNetwork);
  }, [activeNetwork]);

  // Update context when network type changes
  useEffect(() => {
    setActiveNetwork(networkType);
  }, [networkType, setActiveNetwork]);

  const checkRpcStatus = async () => {
    setIsLoading(true);
    
    try {
      const { url, isCustom, isAlchemy } = await getEthereumRpcInfo(networkType);
      
      let rpcType: 'alchemy' | 'custom' | 'public' = 'public';
      if (isCustom) {
        rpcType = isAlchemy ? 'alchemy' : 'custom';
      }
      
      let isHealthy = false;
      let responseTime = undefined;
      
      logDebug('RPC_STATUS', `Checking Ethereum RPC health: ${rpcType} endpoint at ${url.substring(0, 25)}...`);
      
      try {
        const testResult = await testEthereumRpc(url);
        isHealthy = testResult.success;
        responseTime = Math.round(testResult.latency);
        
        setTotalRequests(prev => prev + 1);
        logDebug('RPC_STATUS', `Ethereum RPC health check: ${isHealthy ? 'healthy' : 'unhealthy'}, response time: ${responseTime}ms`);
      } catch (healthError) {
        console.error('Error checking Ethereum RPC health:', healthError);
        isHealthy = false;
      }
      
      setRpcStatus({
        type: rpcType,
        isHealthy,
        url,
        responseTime,
      });
      
      setLastChecked(new Date());
    } catch (error) {
      console.error('Error in Ethereum RPC status check:', error);
      setRpcStatus({
        type: 'public',
        isHealthy: false,
        url: null,
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const fetchEthPrice = async () => {
    try {
      const price = await getEthPrice();
      setEthPrice(price);
    } catch (error) {
      console.error('Error fetching ETH price:', error);
    }
  };
  
  const testRpcConnection = async () => {
    try {
      if (!rpcStatus.url) {
        return;
      }
      
      console.log(`🔍 TEST ETHEREUM RPC REQUEST to: ${rpcStatus.url}`);
      logDebug('RPC_TEST', `Manual Ethereum test request to: ${rpcStatus.url}`);
      
      const testResult = await testEthereumRpc(rpcStatus.url);
      
      setTotalRequests(prev => prev + 1);
      
      if (testResult.success) {
        console.log(`✅ TEST ETHEREUM RPC RESPONSE received in ${Math.round(testResult.latency)}ms`);
        logDebug('RPC_TEST', `Response received in ${Math.round(testResult.latency)}ms`);
        toast.success(`RPC test successful: ${Math.round(testResult.latency)}ms`);
      } else {
        console.error('Ethereum RPC test failed:', testResult.error);
        logDebug('RPC_TEST', `Test failed: ${testResult.error}`);
        toast.error(`RPC test failed: ${testResult.error}`);
      }
      
      checkRpcStatus();
    } catch (error) {
      console.error('Ethereum RPC test failed:', error);
      logDebug('RPC_TEST', `Test failed: ${error.message}`);
      toast.error('RPC test failed');
    }
  };
  
  useEffect(() => {
    checkRpcStatus();
    fetchEthPrice();
    
    const intervalId = setInterval(() => {
      checkRpcStatus();
      fetchEthPrice();
    }, 60000); // Check every minute
    
    return () => clearInterval(intervalId);
  }, [networkType]);
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Ethereum RPC Status</CardTitle>
        <CardDescription>
          Using {rpcStatus.type === 'alchemy' ? 'Alchemy' : rpcStatus.type === 'custom' ? 'custom' : 'public'} RPC
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : rpcStatus.isHealthy ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <AlertCircle className="h-4 w-4 text-amber-500" />
            )}
            
            <Badge variant={rpcStatus.isHealthy ? "default" : "outline"}>
              {rpcStatus.isHealthy ? "Operational" : "Issues Detected"}
            </Badge>
            
            <Badge variant="secondary">
              {networkType === 'mainnet' ? 'Mainnet' : 'Testnet'}
            </Badge>
            
            {rpcStatus.type !== 'public' && (
              <Badge variant="secondary">
                {rpcStatus.type === 'alchemy' ? 'Alchemy' : 'Custom'} 
              </Badge>
            )}
            
            {rpcStatus.responseTime && (
              <Badge variant="outline" className="bg-slate-800">
                {rpcStatus.responseTime}ms
              </Badge>
            )}
          </div>
          
          <div className="text-xs text-muted-foreground">
            {lastChecked 
              ? `Last checked: ${lastChecked.toLocaleTimeString()}` 
              : 'Checking...'}
          </div>
        </div>
        
        {rpcStatus.url && (
          <div className="mt-2 text-xs text-muted-foreground truncate">
            {rpcStatus.url.substring(0, 40)}
            {rpcStatus.url.length > 40 ? '...' : ''}
          </div>
        )}
        
        <div className="mt-2 flex items-center">
          <span className="text-xs font-medium mr-2">ETH Price:</span>
          {ethPrice ? (
            <span className="text-xs font-medium text-green-500">${ethPrice.toLocaleString()}</span>
          ) : (
            <span className="text-xs text-muted-foreground">Loading...</span>
          )}
        </div>
        
        <div className="mt-2 text-xs">
          <span className="font-medium">Test RPC requests:</span> {totalRequests}
        </div>
        
        {rpcStatus.type === 'public' && (
          <div className="flex items-center mt-2">
            {/* Removed warning message about public RPC endpoints */}
          </div>
        )}
      </CardContent>
      <CardFooter className="pt-1 flex justify-between">
        <div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={checkRpcStatus}
            disabled={isLoading}
            className="text-xs mr-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                Checking...
              </>
            ) : (
              <>
                <Gauge className="h-3 w-3 mr-1" />
                Check Status
              </>
            )}
          </Button>
          
          <Button
            variant="secondary"
            size="sm"
            onClick={testRpcConnection}
            disabled={!rpcStatus.url}
            className="text-xs"
          >
            Test RPC Request
          </Button>
        </div>
        
        <div>
          <select
            className="text-xs mr-2 bg-background border rounded px-2 py-1"
            value={networkType}
            onChange={(e) => setNetworkType(e.target.value as 'mainnet' | 'testnet')}
          >
            <option value="mainnet">Mainnet</option>
            <option value="testnet">Testnet</option>
          </select>
          
          <EthereumRpcConfigDialog />
        </div>
      </CardFooter>
    </Card>
  );
}
