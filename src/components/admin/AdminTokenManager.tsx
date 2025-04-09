import { Card } from "@/components/ui/card";
import { TokenManager } from "./TokenManager";
import { WalletButton } from "@/components/wallet/WalletButton";
import { useState, useEffect, useCallback } from "react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { useQueryClient } from "@tanstack/react-query";
import { Switch } from "@/components/ui/switch";
import { Sparkles, AlertCircle, Loader2 } from "lucide-react";
import { getNetwork } from "@/utils/presale/solanaPresale";
import { getActiveNetwork } from "@/utils/wallet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/hooks/use-toast";
import { checkAdminTokenBalance } from "@/utils/token/solanaToken";
import { PhantomSolanaProvider } from "@/types/wallet-providers";
import { Button } from "@/components/ui/button";
import { getTokenInfo } from "@/utils/token/solanaToken";

interface AdminTokenManagerProps {
  activeNetwork?: string;
  onNetworkChange?: (network: string) => void;
  walletConnected?: boolean;
  wallet?: any;
}

export const AdminTokenManager = ({
  activeNetwork: initialNetwork = 'mainnet',
  onNetworkChange = () => {},
  walletConnected = false,
  wallet = null
}: AdminTokenManagerProps) => {
  const [activeNetwork, setActiveNetwork] = useState<string>(getActiveNetwork());
  const [solanaNetwork, setSolanaNetwork] = useState<'devnet' | 'mainnet-beta'>('devnet');
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [walletConnectedState, setWalletConnectedState] = useState(walletConnected);
  const [isCheckingBalance, setIsCheckingBalance] = useState(false);
  const [tokenBalance, setTokenBalance] = useState<number | null>(null);
  const [tokenInfo, setTokenInfo] = useState<any>(null);
  const [loadingTokenInfo, setLoadingTokenInfo] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    fetchTokenInfo();
  }, [activeNetwork]);

  const fetchTokenInfo = async () => {
    try {
      setLoadingTokenInfo(true);
      const info = await getTokenInfo("");
      setTokenInfo(info);
      console.log("Token info loaded:", info);
    } catch (error) {
      console.error("Failed to load token info:", error);
    } finally {
      setLoadingTokenInfo(false);
    }
  };

  useEffect(() => {
    setWalletConnectedState(walletConnected);
  }, [walletConnected]);

  useEffect(() => {
    const checkAndSyncNetwork = async () => {
      try {
        const solanaNetworkValue = await getNetwork();
        setSolanaNetwork(solanaNetworkValue as 'devnet' | 'mainnet-beta');
        
        const storedNetwork = localStorage.getItem('activeNetwork') || 'mainnet';
        
        if (solanaNetworkValue === 'devnet' && storedNetwork !== 'testnet') {
          console.log('Detected Solana devnet, setting network to testnet');
          localStorage.setItem('activeNetwork', 'testnet');
          setActiveNetwork('testnet');
          
          window.dispatchEvent(new CustomEvent('presaleNetworkChanged', {
            detail: { 
              network: 'testnet', 
              solanaNetwork: 'devnet',
              message: 'Network automatically synchronized: Solana devnet → Application testnet'
            }
          }));
          
          setShowSuccessAlert(true);
          setTimeout(() => setShowSuccessAlert(false), 3000);
          
          onNetworkChange('testnet');
          
          queryClient.invalidateQueries({ queryKey: ['presaleSettings'] });
          queryClient.invalidateQueries({ queryKey: ['presaleStages'] });
          queryClient.invalidateQueries({ queryKey: ['presaleContributions'] });
          queryClient.invalidateQueries({ queryKey: ['tokenInfo'] });
        } else if (solanaNetworkValue === 'mainnet-beta' && storedNetwork !== 'mainnet') {
          console.log('Detected Solana mainnet, setting network to mainnet');
          localStorage.setItem('activeNetwork', 'mainnet');
          setActiveNetwork('mainnet');
          
          window.dispatchEvent(new CustomEvent('presaleNetworkChanged', {
            detail: { 
              network: 'mainnet', 
              solanaNetwork: 'mainnet-beta',
              message: 'Network automatically synchronized: Solana mainnet-beta → Application mainnet'
            }
          }));
          
          setShowSuccessAlert(true);
          setTimeout(() => setShowSuccessAlert(false), 3000);
          
          onNetworkChange('mainnet');
          
          queryClient.invalidateQueries({ queryKey: ['presaleSettings'] });
          queryClient.invalidateQueries({ queryKey: ['presaleStages'] });
          queryClient.invalidateQueries({ queryKey: ['presaleContributions'] });
          queryClient.invalidateQueries({ queryKey: ['tokenInfo'] });
        } else {
          setActiveNetwork(storedNetwork);
        }
        
        console.log(`Network mapping: Solana ${solanaNetworkValue} → Application ${solanaNetworkValue === 'devnet' ? 'testnet' : 'mainnet'}`);
      } catch (error) {
        console.error('Error syncing network:', error);
      }
    };
    
    checkAndSyncNetwork();
    
    const handleNetworkChange = () => {
      console.log("Network change detected in AdminTokenManager");
      checkAndSyncNetwork();
    };
    
    window.addEventListener('networkChanged', handleNetworkChange);
    window.addEventListener('walletChanged', handleNetworkChange);
    window.addEventListener('presaleNetworkChanged', handleNetworkChange);
    
    return () => {
      window.removeEventListener('networkChanged', handleNetworkChange);
      window.removeEventListener('walletChanged', handleNetworkChange);
      window.removeEventListener('presaleNetworkChanged', handleNetworkChange);
    };
  }, [onNetworkChange, queryClient]);

  const handleNetworkChange = (network: string) => {
    console.log(`Token Manager: Network changed to ${network}`);
    setActiveNetwork(network);
    
    const solanaNetworkValue = network === 'testnet' ? 'devnet' : 'mainnet-beta';
    setSolanaNetwork(solanaNetworkValue);
    
    onNetworkChange(network);
    
    queryClient.invalidateQueries({ queryKey: ['presaleSettings'] });
    queryClient.invalidateQueries({ queryKey: ['presaleStages'] });
    queryClient.invalidateQueries({ queryKey: ['presaleContributions'] });
    queryClient.invalidateQueries({ queryKey: ['tokenInfo'] });
    
    setShowSuccessAlert(true);
    
    setTimeout(() => {
      setShowSuccessAlert(false);
    }, 3000);
    
    localStorage.setItem('activeNetwork', network);
    localStorage.setItem('tokenManagerNetwork', network);
    
    window.dispatchEvent(new CustomEvent('presaleNetworkChanged', {
      detail: { 
        network, 
        solanaNetwork: solanaNetworkValue,
        message: `Network manually changed: ${network} (Solana ${solanaNetworkValue})`
      }
    }));
  };

  const toggleNetwork = () => {
    const newNetwork = activeNetwork === 'mainnet' ? 'testnet' : 'mainnet';
    handleNetworkChange(newNetwork);
  };

  const handleWalletConnectionChange = (connected: boolean) => {
    console.log(`Wallet connection status changed: ${connected}`);
    setWalletConnectedState(connected);
    if (connected) {
      fetchTokenInfo();
    }
  };

  const handleCheckBalance = useCallback(async () => {
    if (!walletConnectedState) {
      toast.warning("Wallet not connected", {
        description: "Please connect your wallet to check token balance"
      });
      return;
    }
    
    setIsCheckingBalance(true);
    setTokenBalance(null);
    
    try {
      const result = await checkAdminTokenBalance(window.phantom?.solana, tokenInfo?.mintAddress || "");
      if (result.success && result.balance !== undefined) {
        setTokenBalance(result.balance);
      } else {
        toast.error("Balance check failed", {
          description: result.error || "Could not retrieve token balance"
        });
      }
    } catch (error: any) {
      toast.error("Balance check error", {
        description: error.message || "An unexpected error occurred"
      });
    } finally {
      setIsCheckingBalance(false);
    }
  }, [walletConnectedState, tokenInfo?.mintAddress]);

  const getPhantomProvider = (): PhantomSolanaProvider | undefined => {
    if (typeof window !== 'undefined' && window.phantom?.solana) {
      return window.phantom.solana;
    }
    return undefined;
  };

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)] max-h-[900px]">
      <Card className="p-6 flex-none">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <h2 className="text-2xl font-bold">Token Management</h2>
          <WalletButton 
            onConnectChange={handleWalletConnectionChange}
          />
        </div>

        <div className="bg-muted/50 p-4 rounded-lg mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-500" />
              <div>
                <h3 className="font-medium">Network Environment</h3>
                <p className="text-sm text-muted-foreground">
                  Toggle between Mainnet and Devnet for testing
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={activeNetwork === 'testnet' ? 'text-muted-foreground' : 'font-medium'}>Mainnet</span>
              <Switch 
                checked={activeNetwork === 'testnet'} 
                onCheckedChange={toggleNetwork}
              />
              <span className={activeNetwork === 'mainnet' ? 'text-muted-foreground' : 'font-medium'}>Devnet</span>
            </div>
          </div>
          <div className="mt-2 text-xs text-amber-500/80">
            Application network: <span className="font-medium">{activeNetwork}</span>, 
            Solana network: <span className="font-medium">{solanaNetwork}</span>
          </div>
        </div>
        
        {tokenInfo?.mintAddress && (
          <div className="border border-muted rounded-lg p-4 mb-4 bg-card">
            <h3 className="font-medium mb-2">Token Metadata</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div>
                <p className="text-xs text-muted-foreground">Token Name</p>
                <p className="font-medium">{tokenInfo.name || 'Not set'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Symbol</p>
                <p className="font-medium">{tokenInfo.symbol || 'Not set'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Mint Address</p>
                <p className="text-sm font-mono break-all">{tokenInfo.mintAddress}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Supply</p>
                <p className="font-medium">{tokenInfo.totalSupply?.toLocaleString()}</p>
              </div>
            </div>
          </div>
        )}
        
        {walletConnectedState && (
          <div className="flex flex-col sm:flex-row gap-3 mb-3">
            <Button 
              variant="outline" 
              onClick={handleCheckBalance} 
              disabled={isCheckingBalance || !tokenInfo?.mintAddress}
              className="flex items-center gap-2"
            >
              {isCheckingBalance ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Check Wallet Balance
            </Button>
            
            {tokenBalance !== null && (
              <div className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 py-2 px-3 rounded-md flex items-center">
                <span className="font-medium">{tokenBalance.toLocaleString()}</span>
                <span className="ml-1">{tokenInfo?.symbol || 'tokens'}</span>
              </div>
            )}
          </div>
        )}
        
        {!walletConnectedState && (
          <Alert variant="default" className="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
            <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <AlertTitle>Wallet not connected</AlertTitle>
            <AlertDescription>
              Connect your wallet to check token balance and manage token functionality.
            </AlertDescription>
          </Alert>
        )}
        
        <p className="text-muted-foreground mt-4">
          Create and manage your {tokenInfo?.symbol || 'CLAB'} token on Solana. You'll need to connect your Phantom wallet to mint the token.
        </p>
        
        {showSuccessAlert && (
          <Alert className="mt-4">
            <AlertTitle>Network Changed</AlertTitle>
            <AlertDescription>
              Switched to {activeNetwork === 'mainnet' ? 'Mainnet' : 'Devnet'} network. All data has been refreshed.
            </AlertDescription>
          </Alert>
        )}
      </Card>
      
      <div className="flex-grow overflow-hidden mt-4">
        <ScrollArea className="h-full pr-4">
          <TokenManager 
            activeNetwork={activeNetwork}
            onNetworkChange={handleNetworkChange}
            walletConnected={walletConnectedState}
            wallet={wallet}
            onTokenInfoUpdated={fetchTokenInfo}
          />
        </ScrollArea>
      </div>
    </div>
  );
};
