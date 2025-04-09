
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wallet, CheckCircle2, Loader2, AlertCircle, RotateCcw, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useDistributionWallet } from '@/hooks/useDistributionWallet';
import { toast } from 'sonner';
import { simpleSolflareConnect, checkSolflareState } from '@/utils/wallet/simpleSolflareConnect';
import { logDebug } from '@/utils/debugLogging';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface DistributionWalletConnectProps {
  onWalletChange: (connected: boolean, wallet: any) => void;
}

export function DistributionWalletConnect({ onWalletChange }: DistributionWalletConnectProps) {
  const { 
    isConnected, 
    isConnecting, 
    walletAddress, 
    walletType, 
    wallet,
    connectPhantom, 
    connectSolflare, 
    disconnect 
  } = useDistributionWallet();
  
  const [isLocalProcessing, setIsLocalProcessing] = useState(false);
  const [connectionMethod, setConnectionMethod] = useState<string>('normal');
  const [showAdvancedTroubleshooting, setShowAdvancedTroubleshooting] = useState(false);
  const [hasConnectionFailed, setHasConnectionFailed] = useState(false);

  // Validate wallet state immediately upon changes
  useEffect(() => {
    if (isConnected && walletAddress && wallet) {
      console.log("Distribution wallet connected, validating...", {
        address: walletAddress,
        type: walletType,
        hasPublicKey: !!wallet.publicKey,
        hasSignAndSendTransaction: !!wallet.signAndSendTransaction
      });
      
      if (!wallet.publicKey) {
        console.error("Connected wallet is missing publicKey property");
        toast.error("Wallet connection issue: Missing public key");
        onWalletChange(false, null);
        return;
      }
      
      if (!wallet.signAndSendTransaction) {
        console.warn("Wallet is missing signAndSendTransaction method");
        toast.warning("Connected wallet may have limited functionality");
      }
      
      console.log("Valid wallet detected, forwarding to parent component");
      onWalletChange(true, wallet);
      setHasConnectionFailed(false);
    } else {
      onWalletChange(false, null);
    }
  }, [isConnected, walletAddress, walletType, wallet, onWalletChange]);

  // Extra check on mount and every 5 seconds - directly check Solflare state
  useEffect(() => {
    // Skip if already connected through normal means
    if (isConnected && walletAddress && wallet && wallet.publicKey) {
      return;
    }
    
    const checkDirectConnection = () => {
      const state = checkSolflareState();
      
      if (state.connected && state.hasPublicKey && state.address) {
        // We have a direct connection to Solflare despite the adapter saying otherwise
        logDebug('DISTRIBUTION_WALLET', `Direct check found connected wallet: ${state.address}`);
        
        // If we have a valid direct connection, use it
        if (window.solflare) {
          onWalletChange(true, window.solflare);
        }
      }
    };
    
    // Check immediately and then every 5 seconds
    checkDirectConnection();
    const interval = setInterval(checkDirectConnection, 5000);
    
    return () => clearInterval(interval);
  }, [isConnected, walletAddress, wallet, onWalletChange]);

  const handleConnectPhantom = async () => {
    try {
      setHasConnectionFailed(false);
      const success = await connectPhantom();
      console.log("Phantom wallet connection result:", success);
      
      if (!success) {
        setHasConnectionFailed(true);
      }
      
      if (success && wallet && !wallet.publicKey) {
        console.error("Phantom connected but public key is missing");
        toast.error("Failed to get public key from Phantom. Please try again.");
        setHasConnectionFailed(true);
      }
    } catch (error) {
      console.error("Error connecting to Phantom:", error);
      toast.error("Failed to connect to Phantom wallet");
      setHasConnectionFailed(true);
    }
  };

  const handleConnectSolflare = async () => {
    try {
      setIsLocalProcessing(true);
      setHasConnectionFailed(false);
      
      let success = false;
      
      // Use the connection method selected by the user
      if (connectionMethod === 'direct') {
        // Direct connection using our simplified utility
        logDebug('DISTRIBUTION_CONNECT', 'Trying direct Solflare connection');
        
        const directResult = await simpleSolflareConnect();
        
        if (directResult.success && directResult.address) {
          logDebug('DISTRIBUTION_CONNECT', 'Direct connection succeeded, refreshing wallet state');
          
          // Force a wallet refresh with direct extension data
          if (window.solflare?.isConnected && window.solflare?.publicKey) {
            const directWallet = window.solflare;
            onWalletChange(true, directWallet);
            success = true;
          }
        }
      } else {
        // Regular connection via the adapter
        logDebug('DISTRIBUTION_CONNECT', 'Trying regular Solflare connection');
        success = await connectSolflare();
      }
      
      if (!success) {
        setHasConnectionFailed(true);
        toast.error("Failed to connect to Solflare. Please try the alternative connection method or our troubleshooting tips.");
      }
      
      console.log("Solflare wallet connection result:", success);
      
      if (success && wallet && !wallet.publicKey) {
        console.error("Solflare connected but public key is missing");
        toast.error("Failed to get public key from Solflare. Please try again with a different method.");
        setHasConnectionFailed(true);
      }
    } catch (error) {
      console.error("Error connecting to Solflare:", error);
      toast.error("Failed to connect to Solflare wallet");
      setHasConnectionFailed(true);
    } finally {
      setIsLocalProcessing(false);
    }
  };

  const handleDisconnect = async () => {
    await disconnect();
    onWalletChange(false, null);
    setHasConnectionFailed(false);
  };

  // Display wallet connection error state
  const hasWalletError = isConnected && wallet && !wallet.publicKey;

  // Render troubleshooting tips when connection fails
  const renderTroubleshootingTips = () => (
    <div className="mt-4 bg-amber-50/10 border border-amber-200/20 rounded-lg p-3 text-xs space-y-2">
      <h4 className="font-medium text-amber-200 flex items-center">
        <AlertCircle className="h-3.5 w-3.5 mr-1" />
        Connection Troubleshooting
      </h4>
      <ul className="list-disc list-inside space-y-1 text-zinc-300">
        <li>Close and reopen your browser completely</li>
        <li>Make sure your Solflare extension is up-to-date</li>
        <li>Try using a different browser (Chrome or Brave recommended)</li>
        <li>Disable other wallet extensions temporarily</li>
        <li>Check that your Solflare wallet is unlocked</li>
        <li>Try the alternative connection method above</li>
      </ul>
      <div className="flex items-center gap-2 mt-2">
        <Button
          size="sm"
          variant="outline"
          className="text-xs h-7 px-2 border-amber-200/30 text-amber-200"
          onClick={() => window.open('https://solflare.com/download', '_blank')}
        >
          <ExternalLink className="h-3 w-3 mr-1.5" />
          Reinstall Solflare
        </Button>
        
        <Button
          size="sm"
          variant="outline"
          className="text-xs h-7 px-2 border-amber-200/30 text-amber-200"
          onClick={() => window.location.reload()}
        >
          <RotateCcw className="h-3 w-3 mr-1.5" />
          Reload Page
        </Button>
      </div>
    </div>
  );

  return (
    <Card className="border-zinc-700 bg-zinc-900 shadow-md">
      <CardHeader>
        <CardTitle className="text-zinc-100">Distribution Wallet</CardTitle>
        <CardDescription className="text-zinc-400">
          Connect a wallet to distribute tokens
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {isConnected && walletAddress ? (
          <div className="flex items-center justify-between rounded-lg bg-zinc-800 p-4 border border-zinc-700">
            <div className="flex items-center gap-3">
              <div className={`flex items-center justify-center h-10 w-10 rounded-full ${hasWalletError ? 'bg-red-500/10 border border-red-500/30' : 'bg-green-500/10 border border-green-500/30'}`}>
                {hasWalletError ? (
                  <AlertCircle className="h-5 w-5 text-red-500" />
                ) : (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                )}
              </div>
              
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-zinc-100">
                    {walletType === 'phantom' ? 'Phantom' : 
                     walletType === 'solflare' ? 'Solflare' : 
                     walletType || 'Wallet'} {hasWalletError ? 'Error' : 'Connected'}
                  </span>
                  <Badge variant={hasWalletError ? "destructive" : "success"} className="text-[10px] py-0 px-1.5">
                    {hasWalletError ? 'Invalid' : 'Connected'}
                  </Badge>
                </div>
                <div className="text-xs font-mono text-zinc-400">
                  {walletAddress.substring(0, 6)}...{walletAddress.substring(walletAddress.length - 4)}
                  {hasWalletError && (
                    <div className="text-red-400 mt-1">
                      Public key missing. Please reconnect.
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <Button 
              variant="outline"
              size="sm"
              onClick={handleDisconnect}
              className="bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700 hover:text-zinc-200"
            >
              Disconnect
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <Tabs defaultValue="phantom" className="w-full">
              <TabsList className="grid grid-cols-2 mb-4">
                <TabsTrigger value="phantom">Phantom</TabsTrigger>
                <TabsTrigger value="solflare">Solflare</TabsTrigger>
              </TabsList>
              
              <TabsContent value="phantom" className="mt-0">
                <Button
                  variant="default"
                  onClick={handleConnectPhantom}
                  disabled={isConnecting || isLocalProcessing}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white border-none px-6 py-2 shadow-md flex items-center justify-center"
                >
                  {isConnecting || isLocalProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      <span>Connecting...</span>
                    </>
                  ) : (
                    <>
                      <Wallet className="mr-2 h-4 w-4" />
                      <span>Connect Phantom</span>
                    </>
                  )}
                </Button>
              </TabsContent>
              
              <TabsContent value="solflare" className="mt-0 space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="default"
                    onClick={() => {
                      setConnectionMethod('normal');
                      handleConnectSolflare();
                    }}
                    disabled={isConnecting || isLocalProcessing}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white border-none px-6 py-2 shadow-md flex items-center justify-center"
                  >
                    {isConnecting || isLocalProcessing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        <span>Connecting...</span>
                      </>
                    ) : (
                      <>
                        <img 
                          src="/lovable-uploads/e8637576-de29-474e-aa98-1b520d678210.png" 
                          alt="Solflare" 
                          className="w-4 h-4 mr-2" 
                        />
                        <span>Standard Connect</span>
                      </>
                    )}
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => {
                      setConnectionMethod('direct');
                      handleConnectSolflare();
                    }}
                    disabled={isConnecting || isLocalProcessing}
                    className="w-full border-orange-500 text-orange-500 hover:bg-orange-500/10 flex items-center justify-center"
                  >
                    {isConnecting || isLocalProcessing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        <span>Connecting...</span>
                      </>
                    ) : (
                      <>
                        <img 
                          src="/lovable-uploads/e8637576-de29-474e-aa98-1b520d678210.png" 
                          alt="Solflare" 
                          className="w-4 h-4 mr-2" 
                        />
                        <span>Alternative Connect</span>
                      </>
                    )}
                  </Button>
                </div>
                
                {hasConnectionFailed && renderTroubleshootingTips()}
                
                <Button 
                  variant="link" 
                  className="text-xs text-zinc-400 hover:text-zinc-300 p-0 h-auto w-full flex justify-center"
                  onClick={() => setShowAdvancedTroubleshooting(!showAdvancedTroubleshooting)}
                >
                  {showAdvancedTroubleshooting ? 'Hide' : 'Show'} Advanced Details
                </Button>
                
                {showAdvancedTroubleshooting && (
                  <div className="text-xs p-3 bg-zinc-800 rounded-md border border-zinc-700">
                    <p className="mb-2 text-zinc-400">Try these additional steps if you're having persistent issues:</p>
                    <ol className="list-decimal list-inside space-y-1 text-zinc-400">
                      <li>Clear your browser cache and cookies</li>
                      <li>Disable all other wallet extensions</li>
                      <li>Try in an incognito/private window</li>
                      <li>Use Solflare mobile app instead of browser extension</li>
                      <li>Check for browser settings that might be blocking extension communication</li>
                    </ol>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
