import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { getCurrentPresaleStage, getAllPresaleStages, getPresaleStatus, getNetwork, contributeToPresale } from "@/utils/presale/solanaPresale";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Wallet, Clock, Coins, CreditCard, Landmark, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PresalePurchaseSuccess } from "@/components/shortcodes/PresalePurchaseSuccess";
import { WalletButton } from "@/components/wallet/WalletButton";
import { WalletModal } from "@/components/wallet/WalletModal";
import { getCurrentWalletAddress } from "@/utils/wallet";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Connection, PublicKey, Commitment, LAMPORTS_PER_SOL, Transaction, SystemProgram } from '@solana/web3.js';
import { createTokenTransferTransaction } from "@/utils/presale/testConnection";
import { formatDistanceToNow, format, differenceInSeconds, isAfter, isBefore } from 'date-fns';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { WalletOptions } from "@/components/wallet/WalletOptions";
import { UserContributions } from "./presale/UserContributions";
import { useWalletConnection } from "@/hooks/useWalletConnection";
import { PurchaseForm } from "@/components/presale/PurchaseForm";
import { Card } from "@/components/ui/card";
import { handleInputChange, getMinimumPurchaseAmount } from "@/utils/presale/purchaseHandlers";
import { toast } from "sonner";
import { getOptimalConnection } from "@/utils/presale/solanaPresaleApi";
import { WalletType } from '@/services/wallet/walletService';

const getActiveNetwork = (): 'mainnet' | 'testnet' => {
  try {
    const stored = localStorage.getItem('activeNetwork');
    return stored === 'testnet' ? stored : 'mainnet';
  } catch (e) {
    return 'mainnet';
  }
};

export const TokenPresale = () => {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [walletType, setWalletType] = useState<WalletType | null>(null);
  const [tokenInfo, setTokenInfo] = useState<any>({});
  const [stageData, setStageData] = useState<any>(null);
  const [nextStage, setNextStage] = useState<any>(null);
  const [presaleStatus, setPresaleStatus] = useState<string>('active');
  const [solPrice, setSolPrice] = useState<number>(0);
  const [isConnecting, setIsConnecting] = useState(false);
  const [network, setNetwork] = useState<'devnet' | 'mainnet-beta'>('mainnet-beta');
  const [presaleNetwork, setPresaleNetwork] = useState<'mainnet' | 'testnet'>(
    typeof window !== 'undefined' && localStorage.getItem('activeNetwork') === 'testnet' 
      ? 'testnet' 
      : 'mainnet'
  );
  const [solAmount, setSolAmount] = useState<string>("");  // Changed to string type
  const [tokens, setTokens] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isAnimated, setIsAnimated] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [successDetails, setSuccessDetails] = useState({
    transactionAmount: "0",
    tokenAmount: "0"
  });
  const [solCurrency, setSolCurrency] = useState<"SOL" | "USDC" | "USDT">("SOL");
  const [totalStages, setTotalStages] = useState<number>(0);
  const [currentStageNumber, setCurrentStageNumber] = useState<number>(0);
  const [stagesError, setStagesError] = useState<string | null>(null);
  const [presaleWalletConfigured, setPresaleWalletConfigured] = useState<boolean>(true);
  const [presaleConfigError, setPresaleConfigError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<string>('');
  const [countdownTarget, setCountdownTarget] = useState<string>('');
  const [usdTokenPrice, setUsdTokenPrice] = useState<number>(0);
  const [walletConnected, setWalletConnected] = useState<boolean>(false);
  const queryClient = useQueryClient();
  const {
    toast
  } = useToast();
  const [isTestMode, setIsTestMode] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  // Add proper type for the custom events
  interface GlobalWalletEventDetail {
    connected: boolean;
    address?: string;
    type?: string;
  }
  
  interface WalletChangedEventDetail {
    action: string;
    wallet?: {
      address: string;
      type: string;
    };
  }
  
  interface WalletSessionEventDetail {
    walletAddress: string | null;
    walletType: string | null;
  }
  
  interface GlobalWalletCustomEvent extends CustomEvent {
    detail: GlobalWalletEventDetail;
  }
  
  interface WalletChangedCustomEvent extends CustomEvent {
    detail: WalletChangedEventDetail;
  }
  
  interface WalletSessionCustomEvent extends CustomEvent {
    detail: WalletSessionEventDetail;
  }

  interface ProfileLoadedEventDetail {
    id: string;
    walletAddress: string;
    walletType: string;
  }

  interface ProfileLoadedCustomEvent extends CustomEvent {
    detail: ProfileLoadedEventDetail;
  }

  // Add proper type for Solflare events
  interface SolflareEvent {
    publicKey: {
      toString: () => string;
    };
  }

  const { data: fetchedCurrentStage, isLoading: isLoadingStage } = useQuery({
    queryKey: ['activePresaleStage', presaleNetwork],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('presale_stages')
          .select('*')
          .eq('is_active', true)
          .eq('network', presaleNetwork)
          .single();
        
        if (error) {
          console.error("Error fetching active presale stage:", error);
          return null;
        }
        
        return data;
      } catch (err) {
        console.error("Failed to fetch active presale stage:", err);
        return null;
      }
    }
  });

  const activeStage = stageData || fetchedCurrentStage;

  // Check wallet connection status on component mount
  useEffect(() => {
    const storedWalletAddress = localStorage.getItem('walletAddress');
    const storedWalletType = localStorage.getItem('walletType');
    
    if (storedWalletAddress && storedWalletType) {
      console.log(`[TokenPresale] Found stored wallet: ${storedWalletType}:${storedWalletAddress}`);
      setWalletAddress(storedWalletAddress);
      setWalletType(storedWalletType as WalletType);
      setWalletConnected(true);
    }
    
    // Add direct listener for Solflare wallet changes
    const handleSolflareChange = () => {
      if (window.solflare && window.solflare.isConnected && window.solflare.publicKey) {
        const address = (window.solflare as SolflareEvent).publicKey.toString();
        console.log(`[TokenPresale] Detected direct Solflare connection: ${address}`);
        setWalletAddress(address);
        setWalletType('solflare' as WalletType);
        setWalletConnected(true);
        
        // Store in localStorage for persistence
        localStorage.setItem('walletAddress', address);
        localStorage.setItem('walletType', 'solflare');
      }
    };
    
    // Check for Solflare connection immediately
    if (window.solflare && window.solflare.isConnected && window.solflare.publicKey) {
      handleSolflareChange();
    }
    
    // Set up listeners for Solflare events
    if (window.solflare) {
      window.solflare.on('connect', handleSolflareChange as any);
    }
    
    return () => {
      // Clean up listeners
      if (window.solflare) {
        window.solflare.off('connect', handleSolflareChange as any);
      }
    };
  }, []);

  useEffect(() => {
    const checkWalletConnection = async () => {
      try {
        const isConnected = await verifyWalletConnection();
        setWalletConnected(isConnected);
        
        // If not connected, clear wallet data
        if (!isConnected) {
          localStorage.removeItem('walletAddress');
          localStorage.removeItem('walletType');
          localStorage.removeItem('walletConnectedAt');
          setWalletAddress(null);
          setWalletType(null);
        }
      } catch (err) {
        console.error("[TokenPresale] Error verifying wallet connection:", err);
        setWalletConnected(false);
      }
    };
    checkWalletConnection();
  }, []);

  useEffect(() => {
    const handleWalletEvent = (event: CustomEvent) => {
      const { connected, address, walletType: type } = event.detail;
      console.log("[TokenPresale] Handling wallet event:", { connected, address, type });
      
      if (connected && address) {
        setWalletAddress(address);
        setWalletType((type || 'phantom') as WalletType);
        // Dispatch event for child components
        window.dispatchEvent(new CustomEvent('walletStateChanged', {
          detail: {
            connected: true,
            address,
            walletType: type || 'phantom'
          }
        }));
      }
    };

    const handleWalletChanged = (event: CustomEvent) => {
      const { action, wallet, walletType } = event.detail;
      console.log("[TokenPresale] Handling wallet changed event:", { action, wallet, walletType });
      
      if (action === 'reconnect' && wallet) {
        setWalletAddress(wallet);
        setWalletType((walletType || 'phantom') as WalletType);
        // Dispatch event for child components
        window.dispatchEvent(new CustomEvent('walletStateChanged', {
          detail: {
            connected: true,
            address: wallet,
            walletType: walletType || 'phantom'
          }
        }));
      }
    };

    const handleWalletSessionChanged = (event: CustomEvent) => {
      console.log("[TokenPresale] Handling wallet session change:", event.detail);
      
      const { walletAddress, walletType } = event.detail;
      
      if (walletAddress) {
        console.log(`[TokenPresale] Setting wallet from session event: ${walletType}:${walletAddress}`);
        setWalletAddress(walletAddress);
        setWalletType(walletType as WalletType);
        
        // Store in localStorage for persistence
        localStorage.setItem('walletAddress', walletAddress);
        if (walletType) localStorage.setItem('walletType', walletType);
        localStorage.setItem('walletConnectedAt', Date.now().toString());
        
        setWalletConnected(true);
      } else {
        // Clear wallet info
        localStorage.removeItem('walletAddress');
        localStorage.removeItem('walletType');
        localStorage.removeItem('walletConnectedAt');
        
        setWalletAddress(null);
        setWalletType(null);
        setWalletConnected(false);
      }
    };

    const handleProfileLoaded = (event: CustomEvent) => {
      console.log("[TokenPresale] Received profileLoaded event with profile:", event.detail);
      
      if (event.detail && event.detail.walletAddress) {
        setWalletAddress(event.detail.walletAddress);
        setWalletType(event.detail.walletType as WalletType);
        setWalletConnected(true);
      }
    };

    const handleWalletConnectionLost = () => {
      toast.error("Wallet connection lost. Please reconnect your wallet.");
      setModalOpen(true);
    };

    window.addEventListener('globalWalletConnected', handleWalletEvent as EventListener);
    window.addEventListener('walletChanged', handleWalletChanged as EventListener);
    window.addEventListener('walletSessionChanged', handleWalletSessionChanged as EventListener);
    window.addEventListener('profileLoaded', handleProfileLoaded as EventListener);
    window.addEventListener('walletConnectionLost', handleWalletConnectionLost);
    
    return () => {
      window.removeEventListener('globalWalletConnected', handleWalletEvent as EventListener);
      window.removeEventListener('walletChanged', handleWalletChanged as EventListener);
      window.removeEventListener('walletSessionChanged', handleWalletSessionChanged as EventListener);
      window.removeEventListener('profileLoaded', handleProfileLoaded as EventListener);
      window.removeEventListener('walletConnectionLost', handleWalletConnectionLost);
    };
  }, []);

  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'walletAddress' || event.key === 'walletType') {
        const storedWalletAddress = localStorage.getItem('walletAddress');
        const storedWalletType = localStorage.getItem('walletType');
        
        console.log("[TokenPresale] Storage change detected:", {
          address: storedWalletAddress,
          type: storedWalletType
        });
        
        setWalletAddress(storedWalletAddress);
        setWalletType(storedWalletType as WalletType);
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  useEffect(() => {
    queryClient.invalidateQueries({
      queryKey: ['presaleSettings']
    });
    queryClient.invalidateQueries({
      queryKey: ['activePresaleStage']
    });
    queryClient.invalidateQueries({
      queryKey: ['totalRaisedTokenPresale']
    });
  }, [queryClient]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAnimated(true);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!solAmount || isNaN(parseFloat(solAmount))) {
      setTokens(0);
      return;
    }
    
    const inputAmount = parseFloat(solAmount);
    if (inputAmount <= 0) {
      setTokens(0);
      return;
    }
    
    let calculatedSolAmount = inputAmount;
    let usdValue = 0;
    
    if (solCurrency === "USDC" || solCurrency === "USDT") {
      usdValue = inputAmount;
      calculatedSolAmount = Number((usdValue / solPrice).toFixed(9));
      console.log(`Converting ${solAmount} ${solCurrency} to ${calculatedSolAmount} SOL at price $${solPrice}`);
      console.log(`Using fixed 1:1 USD value for ${solCurrency}: $${usdValue}`);
    } else {
      usdValue = inputAmount * solPrice;
      console.log(`Converting ${solAmount} SOL to USD: $${usdValue} at price $${solPrice}`);
    }
    
    const tokenPriceInUSD = activeStage?.token_price_usd || (activeStage?.token_price ? activeStage.token_price * solPrice : 0.00025);
    
    if (tokenPriceInUSD <= 0) {
      console.error("Invalid token price in USD:", tokenPriceInUSD);
      setTokens(0);
      return;
    }
    
    setUsdTokenPrice(tokenPriceInUSD);
    const calculatedTokens = usdValue / tokenPriceInUSD;
    
    console.log(`Calculating tokens:`);
    console.log(`- Input: ${solAmount} ${solCurrency}`);
    console.log(`- SOL equivalent: ${calculatedSolAmount} SOL`);
    console.log(`- USD value: $${usdValue}`);
    console.log(`- Token price: $${tokenPriceInUSD} USD per token`);
    console.log(`- Calculated tokens: ${calculatedTokens} CLAB`);
    
    setTokens(calculatedTokens);
  }, [solAmount, activeStage, solCurrency, solPrice]);

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const solResponse = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd');
        const solData = await solResponse.json();
        setSolPrice(solData.solana.usd);
      } catch (error) {
        console.error("Failed to fetch crypto prices:", error);
        setSolPrice(100);
      }
    };
    fetchPrices();
  }, []);

  useEffect(() => {
    const checkNetwork = async () => {
      const currentNetwork = await getNetwork();
      setNetwork(currentNetwork);
      console.log("Current Solana network:", currentNetwork);
      setIsTestMode(currentNetwork === 'devnet');
      const presaleNet = currentNetwork === 'devnet' ? 'testnet' : 'mainnet';
      setPresaleNetwork(presaleNet);
      console.log("Setting presale network to:", presaleNet);
    };
    checkNetwork();
    const handleNetworkChange = async () => {
      const currentNetwork = await getNetwork();
      setNetwork(currentNetwork);
      const presaleNet = currentNetwork === 'devnet' ? 'testnet' : 'mainnet';
      setPresaleNetwork(presaleNet);
      console.log("Network changed to:", currentNetwork, "Presale network:", presaleNet);
    };
    window.addEventListener('networkChanged', handleNetworkChange);
    return () => {
      window.removeEventListener('networkChanged', handleNetworkChange);
    };
  }, []);

  useEffect(() => {
    const handlePresaleNetworkChange = () => {
      const activeNetwork = getActiveNetwork();
      console.log("Presale network changed from global setting to:", activeNetwork);
      setPresaleNetwork(activeNetwork);
      queryClient.invalidateQueries({
        queryKey: ['presaleSettings']
      });
      queryClient.invalidateQueries({
        queryKey: ['activePresaleStage']
      });
      queryClient.invalidateQueries({
        queryKey: ['totalRaisedTokenPresale']
      });
    };
    window.addEventListener('presaleNetworkChanged', handlePresaleNetworkChange);
    return () => {
      window.removeEventListener('presaleNetworkChanged', handlePresaleNetworkChange);
    };
  }, [queryClient]);

  const handleClick = () => {
  };
  
  const handleWalletConnectChange = (connected: boolean, address?: string, type?: string) => {
    console.log("[TokenPresale] Handling wallet connect change:", { connected, address, type });
    
    if (connected && address) {
      // Store wallet info
      localStorage.setItem('walletAddress', address);
      if (type) localStorage.setItem('walletType', type);
      localStorage.setItem('walletConnectedAt', Date.now().toString());
      
      // Update state
      setWalletAddress(address);
      setWalletType(type as WalletType);
      setWalletConnected(true);
    } else {
      // Clear wallet info
      localStorage.removeItem('walletAddress');
      localStorage.removeItem('walletType');
      localStorage.removeItem('walletConnectedAt');
      
      // Reset state
      setWalletAddress(null);
      setWalletType(null);
      setWalletConnected(false);
    }
  };

  const formatUsdPrice = (price: number) => {
    if (price < 0.01) {
      return price.toFixed(4);
    }
    return price.toFixed(2);
  };

  const getTokenPriceInUsd = (tokenPriceInSol: number) => {
    return solPrice > 0 ? tokenPriceInSol * solPrice : 0;
  };

  const isPresaleActive = true;

  const handleSolAmountChange = (amount: number) => {
  };

  useEffect(() => {
    const handlePurchaseSuccess = (event: CustomEvent<{solAmount: number, tokenAmount: number, txHash: string}>) => {
      const { solAmount, tokenAmount, txHash } = event.detail;
      
      console.log("Purchase successful event received:", {
        solAmount,
        tokenAmount,
        txHash
      });
      
      const formattedSolAmount = `${solAmount} SOL`;
      
      setSuccessDetails({
        transactionAmount: formattedSolAmount,
        tokenAmount: tokenAmount.toString()
      });
      
      setShowSuccessPopup(true);
    };
    
    window.addEventListener('purchaseSuccessful', handlePurchaseSuccess as EventListener);
    
    return () => {
      window.removeEventListener('purchaseSuccessful', handlePurchaseSuccess as EventListener);
    };
  }, []);

  // Helper function to verify wallet is truly connected
  const verifyWalletConnection = async (): Promise<boolean> => {
    try {
      if (!walletType || !walletAddress) {
        console.log("[TokenPresale] No wallet type or address stored");
        return false;
      }
      
      if (walletType === 'phantom') {
        if (!window.phantom?.solana) {
          console.error("[TokenPresale] Phantom not available in window");
          return false;
        }
        
        try {
          // Try to silently connect (will only work if already connected)
          const resp = await window.phantom.solana.connect({ onlyIfTrusted: true });
          return !!resp.publicKey;
        } catch (err) {
          console.error("[TokenPresale] Error verifying Phantom connection:", err);
          return false;
        }
      } else if (walletType === 'solflare') {
        if (!window.solflare) {
          console.error("[TokenPresale] Solflare not available in window");
          return false;
        }
        
        try {
          return window.solflare.isConnected && !!window.solflare.publicKey;
        } catch (err) {
          console.error("[TokenPresale] Error verifying Solflare connection:", err);
          return false;
        }
      }
      
      return false;
    } catch (err) {
      console.error("[TokenPresale] Error in verifyWalletConnection:", err);
      return false;
    }
  };

  // Function to attempt reconnection if needed
  const ensureWalletConnection = async (): Promise<boolean> => {
    if (await verifyWalletConnection()) {
      console.log("[TokenPresale] Wallet already connected and verified");
      setWalletConnected(true);
      return true;
    }
    
    console.log("[TokenPresale] Wallet not properly connected, attempting reconnect...");
    
    try {
      if (walletType === 'phantom' && window.phantom?.solana) {
        try {
          const resp = await window.phantom.solana.connect();
          setWalletAddress(resp.publicKey.toString());
          setWalletConnected(true);
          return true;
        } catch (err) {
          console.error("[TokenPresale] Failed to reconnect Phantom:", err);
          return false;
        }
      } else if (walletType === 'solflare' && window.solflare) {
        try {
          const resp = await window.solflare.connect();
          if (resp && window.solflare.publicKey) {
            setWalletAddress(window.solflare.publicKey.toString());
            setWalletConnected(true);
            return true;
          }
          throw new Error("Failed to get Solflare public key");
        } catch (err) {
          console.error("[TokenPresale] Failed to reconnect Solflare:", err);
          return false;
        }
      }
      
      return false;
    } catch (err) {
      console.error("[TokenPresale] Error in ensureWalletConnection:", err);
      return false;
    }
  };

  const initializePresaleSettings = async () => {
  };

  const checkPresaleWalletConfiguration = async () => {
    return true;
  };

  useEffect(() => {
  }, [presaleNetwork]);

  const verifyTokenTransaction = async (txHash: string, currency: string, receiverAddress: string) => {
    return {
      success: false,
      error: `Unknown error verifying ${currency} transaction`
    };
  };

  const handleSolanaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Verify wallet is still connected
      if (!walletAddress) {
        console.error("[TokenPresale] No wallet address found");
        toast.error("Please connect your wallet first");
        return;
      }

      if (!solAmount || parseFloat(solAmount) <= 0) {
        console.error("[TokenPresale] Invalid amount");
        toast.error("Please enter a valid amount");
        return;
      }

      // Verify wallet is still connected
      const isConnected = await verifyWalletConnection();
      if (!isConnected) {
        console.error("[TokenPresale] Wallet connection verification failed");
        toast.error("Your wallet is not properly connected. Please reconnect.");
        setModalOpen(true); // Open the wallet modal instead of direct connection
        return;
      }
      
      // Rest of the submission logic...
      console.log("[TokenPresale] Processing transaction with amount:", solAmount);
      
      // Add your transaction logic here
      // const txHash = await processSolanaTransaction(solAmount);
      // if (txHash) {
      //   toast.success("Transaction successful!");
      // }
      
    } catch (err) {
      console.error("[TokenPresale] Error in handleSolanaSubmit:", err);
      toast.error(err instanceof Error ? err.message : "Failed to process transaction");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const stageCap = activeStage?.target_amount_usd || 
                 (activeStage?.target_amount && solPrice ? 
                  activeStage.target_amount * solPrice : 0);
  
  const formattedStageCap = stageCap ? 
    `$${stageCap.toLocaleString(undefined, {
      maximumFractionDigits: 2
    })}` : 
    '$0';

  const formattedRaisedAmount = activeStage && solPrice ? 
    `$${Number(activeStage.tokens_sold || 0 * activeStage.token_price_usd || 
    (activeStage.token_price * solPrice)).toLocaleString(undefined, {
      maximumFractionDigits: 2
    })}` : 
    '$0';

  const progressPercentage = stageCap > 0 ? 
    Math.min(100, ((activeStage?.tokens_sold || 0) * 
      (activeStage?.token_price_usd || 
        (activeStage?.token_price || 0) * solPrice) / stageCap) * 100) : 0;

  const currentWalletType = (walletType || 'phantom') as WalletType;

  return <div className="w-full max-w-md mx-auto">
      <Card className="bg-white/5 backdrop-blur-lg border border-white/10 p-4">
        {false && <Alert variant="warning" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Presale is temporarily paused. Please check back later.
            </AlertDescription>
          </Alert>}
        
        {false && <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Presale has ended. Thank you for your interest!
            </AlertDescription>
          </Alert>}

        {!presaleWalletConfigured && <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {presaleConfigError || "Presale not configured for this network"}
            </AlertDescription>
          </Alert>}
        
        <div className="mb-4">
          <div className="grid grid-cols-2 gap-2 my-2 text-center">
            <div className="bg-black/30 rounded-md p-2 border border-white/10">
              <div className="text-xs text-gray-400 mb-1">Raised</div>
              <div className="text-lg font-bold text-emerald-400">{formattedRaisedAmount}</div>
            </div>
            <div className="bg-black/30 rounded-md p-2 border border-white/10">
              <div className="text-xs text-gray-400 mb-1">Stage Cap</div>
              <div className="text-lg font-bold text-purple-400">{formattedStageCap}</div>
            </div>
          </div>
          
          <Progress 
            value={progressPercentage} 
            className="h-2" 
          />
        </div>

        <div className="space-y-4">
          <PurchaseForm
            walletAddress={walletAddress}
            setWalletAddress={setWalletAddress}
            walletType={currentWalletType}
            setWalletType={setWalletType}
            solCurrency={solCurrency}
            solPrice={solPrice}
            tokens={tokens}
            currentStage={activeStage}
            presaleSettings={{}}
            isSubmitting={isSubmitting}
            setSolCurrency={(currency: "SOL" | "USDC" | "USDT") => setSolCurrency(currency)}
            setSolAmount={setSolAmount}
            handleSolanaSubmit={handleSolanaSubmit}
            solAmount={solAmount}
            presaleConfigError={!!presaleConfigError}
            presaleWalletConfigured={presaleWalletConfigured}
            setIsSubmitting={setIsSubmitting}
          />
        </div>
      </Card>
      
      <PresalePurchaseSuccess 
        open={showSuccessPopup} 
        onClose={() => setShowSuccessPopup(false)} 
        transactionAmount={successDetails.transactionAmount} 
        tokenAmount={successDetails.tokenAmount} 
      />
      
      <WalletModal 
        open={modalOpen} 
        onOpenChange={setModalOpen} 
        onConnect={handleWalletConnectChange} 
        network={presaleNetwork} 
      />

      <div className="mt-4 flex justify-center">
        <a href="https://app.solidproof.io/projects/crypto-like-a-boss" target="_blank" rel="noopener noreferrer" className="inline-block">
          <img src="/lovable-uploads/c704a74e-49c1-492d-8f47-9691eb17f88a.png" alt="Crypto Like a Boss - Verified by Solidproof" className="h-10 opacity-70 hover:opacity-100 transition-opacity" />
        </a>
      </div>
    </div>;
};
