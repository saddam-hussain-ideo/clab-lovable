// PurchaseForm.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from 'sonner';
import { formatUnits, parseUnits } from 'viem';
import { supabase } from '@/lib/supabase';
import { Connection, PublicKey, LAMPORTS_PER_SOL, SystemProgram, Transaction } from '@solana/web3.js';
import { walletRegistry } from '@/services/wallet/walletRegistry';
import { useWallet } from '@/hooks/useWallet';
import { Loader2 } from 'lucide-react';
import { usePresale } from '@/hooks/usePresale';
import { getEthPrice } from '@/utils/tokenCalculation';
import { SolanaForm } from './forms/SolanaForm';
import { EthereumForm } from './forms/EthereumForm';
import { handleInputChange, fetchActivePresaleStage } from '@/utils/presale/purchaseHandlers';
import { useQuery } from '@tanstack/react-query';
import { TransactionStatus } from '@/components/transaction/TransactionStatus';
import { getBlockchainNetwork } from '@/utils/wallet';
import { walletService } from '@/services/wallet/walletService';
import bs58 from 'bs58';
import { ErrorBoundary } from '@/components/error/ErrorBoundary';
import { connectToPhantom, connectToMetaMask } from '@/utils/wallet/walletConnectionHelper';
// Add Reown App Kit and Wagmi imports
import { useAppKit } from "@reown/appkit/react";
import { useAccount } from "wagmi";

interface PhantomProvider {
  connect: () => Promise<{ publicKey: PublicKey }>;
  disconnect: () => Promise<void>;
  isConnected: boolean;
  publicKey: PublicKey | null;
  on: (event: string, callback: (args: any) => void) => void;
  off: (event: string, callback: (args: any) => void) => void;
  signAndSendTransaction: (transaction: Transaction) => Promise<{ signature: string }>;
  request: (params: { method: string; params?: any[] }) => Promise<any>;
}

interface SolflareProvider {
  connect: () => Promise<{ publicKey: PublicKey }>;
  disconnect: () => Promise<void>;
  isConnected: boolean;
  publicKey: PublicKey | null;
  on: (event: string, callback: (args: any) => void) => void;
  off: (event: string, callback: (args: any) => void) => void;
  signAndSendTransaction: (transaction: Transaction) => Promise<string>;
}

interface CustomWindow extends Window {
  _webSocketProxyConfigured?: boolean;
  OriginalWebSocket?: typeof WebSocket;
  WebSocket: typeof WebSocket;
  phantom?: {
    solana?: PhantomProvider;
  };
  solflare?: SolflareProvider;
  reown?: any;
}

declare const window: CustomWindow;

type WalletType = 'phantom' | 'metamask' | 'solflare' | 'reown' | null;
type NetworkType = 'solana' | 'ethereum';

interface PresaleStage {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  token_price_usd: number;
  tokens_sold: number;
  max_supply: number;
  min_purchase_amount: number;
  max_purchase_amount: number;
  is_active: boolean;
}

interface PurchaseFormProps {
  walletAddress: string | null;
  setWalletAddress: (address: string | null) => void;
  walletType: WalletType;
  setWalletType: (type: WalletType) => void;
  solCurrency: string;
  solPrice: number;
  tokens: number;
  currentStage: any;
  presaleSettings: any;
  isSubmitting: boolean;
  setSolCurrency: (currency: string) => void;
  setSolAmount: (amount: string) => void;
  handleSolanaSubmit: (e: React.FormEvent) => Promise<void>;
  solAmount: string;
  presaleConfigError: boolean;
  presaleWalletConfigured: boolean;
  setIsSubmitting: (isSubmitting: boolean) => void;
}

function PurchaseFormContent(props: PurchaseFormProps) {
  const {
    walletAddress,
    setWalletAddress,
    walletType,
    setWalletType,
    solCurrency,
    solPrice,
    tokens,
    currentStage: parentCurrentStage,
    presaleSettings,
    isSubmitting,
    setSolCurrency,
    setSolAmount,
    handleSolanaSubmit,
    solAmount,
    presaleConfigError,
    presaleWalletConfigured,
    setIsSubmitting,
  } = props;

  const [ethCurrency, setEthCurrency] = useState('ETH');
  const [ethAmount, setEthAmount] = useState('');
  const [ethTokens, setEthTokens] = useState(0);
  const [calculatingTokens, setCalculatingTokens] = useState(false);
  const [ethPriceUsd, setEthPriceUsd] = useState(0);
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [walletConnectionLost, setWalletConnectionLost] = useState(false);
  const [detectedWalletNetwork, setDetectedWalletNetwork] = useState<NetworkType | null>(null);
  const [activeTab, setActiveTab] = useState<'solana' | 'ethereum'>('solana');
  const [currentNetwork, setCurrentNetwork] = useState<NetworkType | null>(null);
  const [isConnectingPhantom, setIsConnectingPhantom] = useState(false);
  const [isConnectingMetamask, setIsConnectingMetamask] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);
  const [currentStage, setCurrentStage] = useState<PresaleStage | null>(null);
  const [solTokens, setSolTokens] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [transactionHash, setTransactionHash] = useState<string | null>(null);

  const { connectWallet: connectEthWallet } = useWallet();
  
  // Use Reown App Kit hooks
  const { open: openReownModal } = useAppKit();
  const { address: reownAddress, isConnected: isReownConnected } = useAccount();

  const { data: currentStageData, error: presaleError, isLoading: isLoadingPresaleStage } = useQuery<PresaleStage | null>({
    queryKey: ['activePresaleStage', activeTab],
    queryFn: async () => {
      try {
        const stage = await fetchActivePresaleStage();
        if (!stage) {
          console.info('No active presale stage found');
          return null;
        }
        return stage;
      } catch (error) {
        console.error('Error fetching presale stage:', error);
        throw error;
      }
    },
    retry: 1,
    staleTime: 1000 * 60 * 5 // 5 minutes
  });

  // Initialize form state from props
  useEffect(() => {
    if (walletAddress && walletType) {
      setIsWalletConnected(true);
      setWalletConnectionLost(false);
      
      // Determine network from wallet address
      if (walletAddress.startsWith('0x')) {
        setDetectedWalletNetwork('ethereum');
        setActiveTab('ethereum');
        setCurrentNetwork('ethereum');
      } else {
        setDetectedWalletNetwork('solana');
        setActiveTab('solana');
        setCurrentNetwork('solana');
      }
    }
  }, [walletAddress, walletType]);

  // Handle global wallet state changes
  useEffect(() => {
    const handleWalletStateChanged = (event: CustomEvent) => {
      const { connected, address, walletType: type } = event.detail;
      console.log("[PurchaseForm] Wallet state changed:", { connected, address, type });
      
      if (connected && address) {
        setWalletAddress(address);
        setWalletType(type as WalletType);
        setIsWalletConnected(true);
        setWalletConnectionLost(false);

        // Determine if it's an Ethereum or Solana address
        if (address.startsWith('0x')) {
          setDetectedWalletNetwork('ethereum');
          setActiveTab('ethereum');
          setCurrentNetwork('ethereum');
        } else {
          setDetectedWalletNetwork('solana');
          setActiveTab('solana');
          setCurrentNetwork('solana');
        }
      } else {
        setWalletAddress(null);
        setWalletType(null);
        setIsWalletConnected(false);
        setWalletConnectionLost(true);
      }
    };

    window.addEventListener('walletStateChanged', handleWalletStateChanged as EventListener);
    return () => {
      window.removeEventListener('walletStateChanged', handleWalletStateChanged as EventListener);
    };
  }, [setWalletAddress, setWalletType]);

  // Handle Reown wallet connection changes
  useEffect(() => {
    if (isReownConnected && reownAddress) {
      // Only update if the address is different or wallet is not connected
      if (reownAddress !== walletAddress || !walletType) {
        console.log("[PurchaseForm] Syncing with Reown wallet:", reownAddress);
        setWalletAddress(reownAddress);
        setWalletType('reown');
        setIsWalletConnected(true);
        setWalletConnectionLost(false);

        // Determine network from address
        if (reownAddress.startsWith('0x')) {
          setDetectedWalletNetwork('ethereum');
          setActiveTab('ethereum');
          setCurrentNetwork('ethereum');
        } else {
          setDetectedWalletNetwork('solana');
          setActiveTab('solana');
          setCurrentNetwork('solana');
        }
      }
    } else if (!isReownConnected && walletType === 'reown') {
      // Clear wallet if Reown disconnects
      console.log("[PurchaseForm] Reown wallet disconnected");
      setWalletAddress(null);
      setWalletType(null);
      setIsWalletConnected(false);
      setWalletConnectionLost(true);
    }
  }, [isReownConnected, reownAddress, walletAddress, walletType, setWalletAddress, setWalletType]);

  const handleConnectMetamask = async () => {
    try {
      setIsConnectingMetamask(true);
      
      // Use Reown modal instead of direct connection
      openReownModal();
      
    } catch (error) {
      console.error('Error connecting to MetaMask:', error);
      toast.error('Failed to connect to MetaMask');
    } finally {
      setIsConnectingMetamask(false);
    }
  };

  const handlePhantomConnect = async () => {
    try {
      setIsConnectingPhantom(true);
      
      // Use Reown modal instead of direct connection
      openReownModal();
      
    } catch (error) {
      console.error('Error connecting to Phantom:', error);
      toast.error('Failed to connect to Phantom');
    } finally {
      setIsConnectingPhantom(false);
    }
  };

  const handlePurchase = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isWalletConnected || !walletAddress || !ethAmount) {
      toast.error('Please connect your wallet and enter an amount');
      return;
    }

    setIsLoading(true);
    setPurchaseSuccess(false);
    setTransactionHash(null);

    try {
      if (!currentStageData) {
        throw new Error('No active presale stage found');
      }

      const amount = parseFloat(ethAmount);
      if (isNaN(amount) || amount <= 0) {
        throw new Error('Please enter a valid amount');
      }

      if (amount < currentStageData.min_purchase_amount) {
        throw new Error(`Minimum purchase amount is ${currentStageData.min_purchase_amount} ${ethCurrency}`);
      }

      if (amount > currentStageData.max_purchase_amount) {
        throw new Error(`Maximum purchase amount is ${currentStageData.max_purchase_amount} ${ethCurrency}`);
      }

      console.log('Processing Ethereum purchase:', { walletAddress, ethAmount, ethCurrency });
      
      // Simulate transaction for now
      setTransactionHash('0x123...');
      setPurchaseSuccess(true);
      toast.success('Purchase initiated! Please confirm the transaction in your wallet.');
    } catch (error) {
      console.error('Purchase error:', error);
      toast.error(error instanceof Error ? error.message : 'Purchase failed');
      setPurchaseSuccess(false);
    } finally {
      setIsLoading(false);
    }
  }, [walletAddress, ethAmount, ethCurrency, isWalletConnected, currentStageData]);

  const handleSolanaFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (handleSolanaSubmit) {
      await handleSolanaSubmit(e);
    }
  };

  useEffect(() => {
    const handleWalletNetworkChange = async () => {
      try {
        const network = getBlockchainNetwork();
        if (network) {
          setDetectedWalletNetwork(network as NetworkType);
          console.log(`[PurchaseForm] Detected wallet network: ${network}`);
        }
      } catch (error) {
        console.error('Error detecting wallet network:', error);
      }
    };

    handleWalletNetworkChange();
  }, []);

  useEffect(() => {
    const handleWalletConnectionLost = () => {
      toast.error("Wallet connection lost", {
        description: "Please reconnect your wallet",
        action: {
          label: "Reconnect",
          onClick: () => openReownModal()
        }
      });
    };

    window.addEventListener('walletConnectionLost', handleWalletConnectionLost);
    return () => {
      window.removeEventListener('walletConnectionLost', handleWalletConnectionLost);
    };
  }, [openReownModal]);

  useEffect(() => {
    const handleGlobalWalletConnect = (event: CustomEvent) => {
      const { connected, address, walletType: type } = event.detail;
      console.log("[PurchaseForm] Global wallet connection event:", { connected, address, type });
      
      if (connected && address) {
        setWalletAddress(address);
        setWalletType(type);
        setIsWalletConnected(true);
        setWalletConnectionLost(false);

        // Determine if it's an Ethereum or Solana address
        if (address.startsWith('0x')) {
          setDetectedWalletNetwork('ethereum');
          setActiveTab('ethereum');
          setCurrentNetwork('ethereum');
        } else {
          setDetectedWalletNetwork('solana');
          setActiveTab('solana');
          setCurrentNetwork('solana');
        }
      } else {
        setWalletAddress(null);
        setWalletType(null);
        setIsWalletConnected(false);
        setWalletConnectionLost(true);
      }
    };

    window.addEventListener('globalWalletConnected', handleGlobalWalletConnect as EventListener);
    return () => {
      window.removeEventListener('globalWalletConnected', handleGlobalWalletConnect as EventListener);
    };
  }, []);

  const handleConnectWallet = async (walletType: WalletType) => {
    try {
      if (walletType === 'metamask') {
        setIsConnectingMetamask(true);
      } else if (walletType === 'phantom') {
        setIsConnectingPhantom(true);
      }
      openReownModal();
    } catch (error) {
      console.error('Error connecting to wallet:', error);
      toast.error('Failed to connect wallet');
    } finally {
      setIsConnectingMetamask(false);
      setIsConnectingPhantom(false);
    }
  };

  const handleSolAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSolAmount(value);
    // Calculate tokens based on amount and price
    if (value && currentStageData) {
      const amount = parseFloat(value);
      if (!isNaN(amount)) {
        let tokenEstimate = 0;
        if (solCurrency === 'SOL') {
          // Use SOL price in USD for calculation
          const solPriceUsd = 100; // This should be fetched from an API
          tokenEstimate = (amount * solPriceUsd) / currentStageData.token_price_usd;
        } else {
          // USDC and USDT are 1:1 with USD
          tokenEstimate = amount / currentStageData.token_price_usd;
        }
        setSolTokens(tokenEstimate);
      }
    }
  };

  const handleEthAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEthAmount(value);
    // Calculate tokens based on amount and price
    if (value && currentStageData) {
      const amount = parseFloat(value);
      if (!isNaN(amount)) {
        let tokenEstimate = 0;
        if (ethCurrency === 'ETH') {
          // Use ETH price in USD for calculation
          const currentEthPrice = ethPriceUsd || 2000; // Use stored price or default
          tokenEstimate = (amount * currentEthPrice) / currentStageData.token_price_usd;
        } else {
          // USDC and USDT are 1:1 with USD
          tokenEstimate = amount / currentStageData.token_price_usd;
        }
        setEthTokens(tokenEstimate);
      }
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {isLoadingPresaleStage ? (
        <div className="flex justify-center items-center h-40">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : currentStageData ? (
        <ErrorBoundary>
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Purchase CLAB Tokens</h2>
              <p className="text-muted-foreground mt-2">
                Current stage: {currentStageData?.name || 'Unknown'} - ${currentStageData?.token_price_usd?.toFixed(4) || '0.0000'} per token
              </p>
              <p className="text-xs text-muted-foreground">
                Stage cap: {(currentStageData?.max_supply || 0).toLocaleString()} tokens ({((currentStageData?.tokens_sold || 0) / (currentStageData?.max_supply || 1) * 100).toFixed(2)}% sold)
              </p>
            </div>

            <Tabs defaultValue="solana" className="space-y-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="solana" className="flex items-center gap-2">
                  <img 
                    src="/assets/images/solana-gradient.png" 
                    alt="Solana" 
                    className="w-5 h-5"
                  />
                  <span>Solana</span>
                </TabsTrigger>
                <TabsTrigger value="ethereum" className="flex items-center gap-2">
                  <img 
                    src="/assets/images/ethereum.png" 
                    alt="Ethereum" 
                    className="w-4 h-6"
                  />
                  <span>Ethereum</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="solana">
                <form onSubmit={handlePurchase}>
                  <SolanaForm
                    walletAddress={walletAddress}
                    walletType={walletType}
                    solCurrency={solCurrency}
                    solAmount={solAmount}
                    tokens={solTokens}
                    isSubmitting={isSubmitting}
                    isConnectingSol={isConnectingPhantom}
                    setSolCurrency={setSolCurrency}
                    setSolAmount={setSolAmount}
                    handleConnectPhantom={() => handleConnectWallet('phantom')}
                    handleSolAmountChange={handleSolAmountChange}
                    setWalletAddress={setWalletAddress}
                    setWalletType={setWalletType}
                    currentStage={currentStageData}
                    stageCap={currentStageData?.max_supply}
                  />
                  
                  <Button
                    type={walletAddress ? "submit" : "button"}
                    className="w-full mt-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-3"
                    disabled={walletAddress ? (isSubmitting || !solAmount || parseFloat(solAmount) <= 0) : false}
                    onClick={() => !walletAddress && handleConnectWallet('phantom')}
                  >
                    {isSubmitting ? (
                      <span className="flex items-center">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </span>
                    ) : walletAddress ? (
                      'Purchase Tokens'
                    ) : (
                      'Connect Wallet'
                    )}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="ethereum">
                <form onSubmit={handlePurchase}>
                  <EthereumForm
                    walletAddress={walletAddress}
                    walletType={walletType}
                    ethCurrency={ethCurrency}
                    ethAmount={ethAmount}
                    tokens={ethTokens}
                    isSubmitting={isSubmitting}
                    isConnectingMetamask={isConnectingMetamask}
                    setEthCurrency={setEthCurrency}
                    handleConnectMetamask={() => handleConnectWallet('metamask')}
                    handleEthAmountChange={handleEthAmountChange}
                    setWalletAddress={setWalletAddress}
                    setWalletType={setWalletType}
                    currentStage={currentStageData}
                    stageCap={currentStageData?.max_supply}
                  />
                  
                  <Button
                    type={walletAddress ? "submit" : "button"}
                    className="w-full mt-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-3"
                    disabled={walletAddress ? (isSubmitting || !ethAmount || parseFloat(ethAmount) <= 0) : false}
                    onClick={() => !walletAddress && handleConnectWallet('metamask')}
                  >
                    {isSubmitting ? (
                      <span className="flex items-center">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </span>
                    ) : walletAddress ? (
                      'Purchase Tokens'
                    ) : (
                      'Connect Wallet'
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
            
            {purchaseSuccess && (
              <div className="mt-4 p-4 bg-green-100 text-green-800 rounded-md">
                Transaction successful! Your tokens will be available in your wallet shortly.
              </div>
            )}
          </div>
        </ErrorBoundary>
      ) : (
        <div className="p-4 bg-yellow-100 text-yellow-800 rounded-md">
          No active presale stage found. Please check back later.
        </div>
      )}
    </div>
  );
}

// Wrap the form with error boundary
export function PurchaseForm(props: PurchaseFormProps) {
  return (
    <ErrorBoundary>
      <PurchaseFormContent {...props} />
    </ErrorBoundary>
  );
}
