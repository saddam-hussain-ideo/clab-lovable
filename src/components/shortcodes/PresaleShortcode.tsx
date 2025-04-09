import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { WalletButton } from "@/components/wallet/WalletButton";
import { useState, useEffect } from "react";
import { getCurrentWalletAddress, getActiveNetwork } from "@/utils/wallet";
import { getNetwork, getCurrentPresaleStage, getPresaleStatus, calculateTokenAmount } from "@/utils/presale/solanaPresale";
import { supabase } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { WalletModal } from "@/components/wallet/WalletModal";
import { PresalePurchaseSuccess } from "./PresalePurchaseSuccess";
import { Input } from "@/components/ui/input";
import { handleInputChange } from "@/utils/presale/purchaseHandlers";

interface PresaleStage {
  id: number;
  name: string;
  order_number: number;
  token_price: number;
  token_price_usd?: number;
  network?: string;
  total_stages?: number;
  [key: string]: any;
}

const safeLocalStorage = {
  getItem: (key: string): string | null => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return localStorage.getItem(key);
      }
      return null;
    } catch (e) {
      console.warn('Failed to access localStorage:', e);
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(key, value);
      }
    } catch (e) {
      console.warn('Failed to write to localStorage:', e);
    }
  }
};

export const PresaleShortcode = () => {
  const navigate = useNavigate();
  const [walletConnected, setWalletConnected] = useState(false);
  const [isTestMode, setIsTestMode] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [currentNetwork, setCurrentNetwork] = useState<'mainnet' | 'testnet'>(getActiveNetwork());
  const [solPrice, setSolPrice] = useState<number>(0);
  const [currentStage, setCurrentStage] = useState<PresaleStage | null>(null);
  const [presaleStatus, setPresaleStatus] = useState<string>('active');
  const [queryClient] = useState(null);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [successDetails, setSuccessDetails] = useState({ 
    transactionAmount: '0',
    tokenAmount: '0'
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [presaleNetwork, setPresaleNetwork] = useState<'mainnet' | 'testnet'>(getActiveNetwork());
  const [tokens, setTokens] = useState<number>(0);
  const [solCurrency, setSolCurrency] = useState('SOL');
  const [solAmount, setSolAmount] = useState<string>('');

  const calculateTokens = (amount: string): number => {
    if (!currentStage || !amount || amount === '' || isNaN(parseFloat(amount))) {
      return 0;
    }
    
    const amountValue = parseFloat(amount);
    if (amountValue <= 0) {
      return 0;
    }
    
    const tokenPriceInUsd = currentStage.token_price_usd || (currentStage.token_price * solPrice);
    
    if (!tokenPriceInUsd || tokenPriceInUsd <= 0) {
      console.warn("Invalid token price for calculation:", tokenPriceInUsd);
      return 0;
    }
    
    const usdValue = amountValue * solPrice;
    const calculatedTokens = usdValue / tokenPriceInUsd;
    
    console.log(`Token calculation:
      - SOL amount: ${amountValue}
      - SOL price: $${solPrice}
      - USD value: $${usdValue}
      - Token price: $${tokenPriceInUsd}
      - Calculated tokens: ${calculatedTokens}`);
    
    return calculatedTokens;
  };

  useEffect(() => {
    try {
      const storedAddress = safeLocalStorage.getItem('walletAddress');
      
      if (storedAddress) {
        setWalletConnected(true);
        setIsInitializing(false);
      } else {
        setWalletConnected(false);
        setIsInitializing(false);
      }
    } catch (error) {
      console.error("Error reading from localStorage:", error);
      setIsInitializing(false);
    }
    
    const checkNetwork = async () => {
      try {
        const solanaNetwork = await getNetwork();
        
        setIsTestMode(solanaNetwork === 'devnet');
        
        if (solanaNetwork === 'devnet') {
          setCurrentNetwork('testnet');
          safeLocalStorage.setItem('activeNetwork', 'testnet');
          
          console.log("Solana is on devnet, setting application network to testnet");
          
          window.dispatchEvent(new CustomEvent('presaleNetworkChanged', {
            detail: { network: 'testnet', solanaNetwork: 'devnet' }
          }));
        } else {
          setCurrentNetwork('mainnet');
          safeLocalStorage.setItem('activeNetwork', 'mainnet');
          
          console.log("Solana is on mainnet-beta, setting application network to mainnet");
          
          window.dispatchEvent(new CustomEvent('presaleNetworkChanged', {
            detail: { network: 'mainnet', solanaNetwork: 'mainnet-beta' }
          }));
        }
        
        console.log(`Network mapping: Solana ${solanaNetwork} → Application ${solanaNetwork === 'devnet' ? 'testnet' : 'mainnet'}`);
      } catch (error) {
        console.error("Error checking network:", error);
        setCurrentNetwork('testnet');
      }
    };
    
    checkNetwork();
    
    const verifyWalletStatus = async () => {
      try {
        const address = await getCurrentWalletAddress();
        setWalletConnected(!!address);
      } catch (error) {
        console.error("Error verifying wallet status:", error);
      }
    };
    
    setTimeout(verifyWalletStatus, 100);
    
    const handleGlobalWalletConnect = (event: Event) => {
      console.log("Global wallet connection detected in PresaleShortcode");
      setWalletConnected(true);
    };
    
    const handleWalletChange = () => {
      try {
        const address = safeLocalStorage.getItem('walletAddress');
        setWalletConnected(!!address);
      } catch (error) {
        console.error("Error reading from localStorage:", error);
      }
      
      setTimeout(verifyWalletStatus, 100);
      
      checkNetwork();
    };
    
    window.addEventListener('globalWalletConnected', handleGlobalWalletConnect);
    window.addEventListener('walletChanged', handleWalletChange);
    window.addEventListener('networkChanged', handleWalletChange);
    window.addEventListener('presaleNetworkChanged', handleWalletChange);
    window.addEventListener('storage', handleWalletChange);
    
    const fetchSolPrice = async () => {
      try {
        const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd');
        const data = await response.json();
        if (data.solana && data.solana.usd) {
          setSolPrice(data.solana.usd);
          console.log("Fetched SOL price:", data.solana.usd);
        }
      } catch (error) {
        console.error("Failed to fetch SOL price:", error);
        setSolPrice(100);
      }
    };

    fetchSolPrice();
    
    const loadPresaleStatus = async () => {
      try {
        console.log(`Loading presale status for network: ${presaleNetwork}`);
        
        setPresaleStatus('active');
        console.log(`Presale status for ${presaleNetwork} forced to: active`);
      } catch (e) {
        console.error("Error loading presale status:", e);
        setPresaleStatus('active');
      }
    };
    
    loadPresaleStatus();
    
    const fetchActiveStage = async () => {
      try {
        const activeNetwork = getActiveNetwork();
        console.log("Fetching active presale stage for", activeNetwork);
        
        const stage = await getCurrentPresaleStage(activeNetwork);
        if (stage) {
          console.log("Found active presale stage:", stage);
          setCurrentStage(stage as PresaleStage);
        } else {
          const { data, error } = await supabase
            .from('presale_stages')
            .select('*')
            .eq('network', activeNetwork)
            .eq('is_published', true)
            .order('order_number', { ascending: true })
            .limit(1)
            .single();
            
          if (error) {
            console.error("Error fetching first published stage:", error);
          } else if (data) {
            console.log("Using first published stage:", data);
            
            const { count, error: countError } = await supabase
              .from('presale_stages')
              .select('*', { count: 'exact', head: true })
              .eq('network', activeNetwork);
              
            if (countError) {
              console.error("Error getting stage count:", countError);
            }
            
            const stageWithCount: PresaleStage = {
              ...data,
              total_stages: count || 1
            };
            
            setCurrentStage(stageWithCount);
          } else {
            console.log("No presale stages found");
            setCurrentStage(null);
          }
        }
      } catch (error) {
        console.error("Error fetching active stage:", error);
      }
    };
    
    fetchActiveStage();
    
    return () => {
      window.removeEventListener('globalWalletConnected', handleGlobalWalletConnect);
      window.removeEventListener('walletChanged', handleWalletChange);
      window.removeEventListener('networkChanged', handleWalletChange);
      window.removeEventListener('presaleNetworkChanged', handleWalletChange);
      window.removeEventListener('storage', handleWalletChange);
    };
  }, [presaleNetwork]);

  useEffect(() => {
    const handlePresaleNetworkChange = (event: Event) => {
      const customEvent = event as CustomEvent<{ network: string, solanaNetwork: string }>;
      const { detail } = customEvent;
      
      if (detail.network === 'mainnet' || detail.network === 'testnet') {
        setCurrentNetwork(detail.network);
        safeLocalStorage.setItem('activeNetwork', detail.network);
      } else {
        console.error(`Invalid network value: ${detail.network}. Must be 'mainnet' or 'testnet'`);
      }
    };
    
    window.addEventListener('presaleNetworkChanged', handlePresaleNetworkChange);
    
    return () => {
      window.removeEventListener('presaleNetworkChanged', handlePresaleNetworkChange);
    };
  }, [queryClient]);

  useEffect(() => {
    const calculatedTokens = calculateTokens(solAmount);
    setTokens(calculatedTokens);
  }, [solAmount, currentStage, solPrice]);

  const handleClick = () => {
    navigate(`/?scrollTo=presale&network=${currentNetwork}`);
  };
  
  const handleWalletConnectChange = (connected: boolean) => {
    setWalletConnected(connected);
    
    if (connected) {
      navigate(`/?scrollTo=presale&network=${currentNetwork}`);
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

  const handleSolAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleInputChange(e.target.value, setSolAmount);
  };

  useEffect(() => {
    const handlePurchaseSuccess = (event: CustomEvent) => {
      const { solAmount, tokenAmount } = event.detail;
      
      console.log("Purchase successful event received:", {
        solAmount,
        tokenAmount
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

  return (
    <>
      {showSuccessPopup && (
        <PresalePurchaseSuccess 
          open={showSuccessPopup} 
          onClose={() => setShowSuccessPopup(false)}
          transactionAmount={successDetails.transactionAmount}
          tokenAmount={successDetails.tokenAmount}
        />
      )}
      
      <WalletModal 
        open={modalOpen}
        onOpenChange={setModalOpen}
        onConnect={(connected, address) => {
          if (connected && address) {
            safeLocalStorage.setItem('walletAddress', address);
            setModalOpen(false);
          }
        }}
        network={presaleNetwork}
      />
      
      <div className="space-y-6 animate-in fade-in-50 duration-500 fill-mode-both">
        {currentStage && (
          <Card className="bg-[#1b2035] border-[#2a324d] overflow-hidden">
            <div className="relative p-6">
              <div className="absolute top-0 right-0 w-24 h-24 bg-purple-600/10 rounded-full blur-2xl"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-600/10 rounded-full blur-3xl"></div>
              
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="flex-shrink-0 bg-[#171f33] p-4 rounded-full border border-[#2a324d]">
                  <img 
                    src="/lovable-uploads/4e5b5f8b-196f-43dc-89f5-1a2e9701d523.png" 
                    alt="Solana Logo" 
                    className="h-8 w-8" 
                  />
                </div>
                
                <div className="flex-grow text-center sm:text-left">
                  <p className="text-gray-300 mb-4">Don't miss your chance to participate in the CLAB token presale with exact token allocation, including decimal precision.</p>
                  
                  <div className="flex items-center justify-center sm:justify-start gap-2 mb-4">
                    {isTestMode && (
                      <Badge variant="warning" className="bg-amber-900/20 border-amber-500/20 text-amber-400">
                        Test Mode
                      </Badge>
                    )}
                    
                    {false && !isTestMode && !isPresaleActive && (
                      <Badge variant="warning" className="bg-red-900/20 border-red-500/20 text-red-400">
                        Ended
                      </Badge>
                    )}
                  </div>
                  
                  {isTestMode && (
                    <div className="bg-amber-900/20 border border-amber-500/20 rounded-md p-3 mb-4">
                      <div className="flex items-start gap-2">
                        <div>
                          <p className="text-amber-400 font-medium">Test Mode Active</p>
                          <div className="text-sm text-amber-300/70">
                            <div className="flex items-center mt-1">
                              <span className="h-2 w-2 bg-amber-500 rounded-full inline-block mr-1"></span>
                              <span>Application: <strong>Testnet</strong></span>
                            </div>
                            <div className="flex items-center mt-1">
                              <span className="h-2 w-2 bg-amber-500 rounded-full inline-block mr-1"></span>
                              <span>Solana: <strong>Devnet</strong></span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {false && !isTestMode && !isPresaleActive && (
                    <Alert variant="warning" className="mb-4">
                      <AlertDescription>
                        <p className="text-amber-300 font-medium">Presale has ended</p>
                        <p className="text-sm text-amber-300/80 mt-1">
                          The CLAB token presale has concluded. Follow our social media for updates on the next phase!
                        </p>
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {currentStage && (
                    <div className="bg-[#171f33] rounded-md p-3 mb-4">
                      <div className="flex flex-col">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400 text-sm">Current Stage:</span>
                          <span className="text-white font-medium">
                            {currentStage.name}
                            <Badge variant="secondary" className="ml-2 text-xs bg-purple-900/30 text-purple-300 border-purple-500/30">
                              {currentStage.order_number} of {currentStage.total_stages || '?'}
                            </Badge>
                          </span>
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-gray-400 text-sm">Price:</span>
                          <span className="text-white">
                            ${getTokenPriceInUsd(currentStage.token_price).toFixed(6)} USD
                            <span className="text-gray-400 text-xs ml-1">
                              ({currentStage.token_price} SOL)
                            </span>
                          </span>
                        </div>
                        {currentStage.token_price_usd && (
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-gray-400 text-sm">USD Price:</span>
                            <span className="text-white">
                              ${currentStage.token_price_usd} USD
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex justify-center mt-2">
                    <WalletButton 
                      className="bg-purple-600 hover:bg-purple-700 text-white font-medium w-full sm:w-auto" 
                      onConnectChange={handleWalletConnectChange}
                      useModal={true}
                      network={currentNetwork}
                      variant="default"
                      isConnecting={isInitializing}
                    />
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}
        
        <Tabs 
          defaultValue="SOL" 
          value={solCurrency} 
          onValueChange={(v) => setSolCurrency(v as 'SOL' | 'USDC' | 'USDT')}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="SOL">
              <div className="flex items-center gap-1.5">
                <img src="/lovable-uploads/7b60f542-a9e0-4da8-83da-6c4d58d98c88.png" alt="SOL" className="h-4 w-4"/>
                SOL
              </div>
            </TabsTrigger>
            <TabsTrigger value="USDC">
              <div className="flex items-center gap-1.5">
                <img src="/lovable-uploads/b629a631-2f33-4dba-ab87-0f911aa40e4f.png" alt="USDC" className="h-4 w-4"/>
                USDC
              </div>
            </TabsTrigger>
            <TabsTrigger value="USDT">
              <div className="flex items-center gap-1.5">
                <img src="/lovable-uploads/e66f81f9-a8b5-4046-b5a8-880ed0f0b3c9.png" alt="USDT" className="h-4 w-4"/>
                USDT
              </div>
            </TabsTrigger>
          </TabsList>
          
          <div className="mt-4">
            <Input
              type="text"
              inputMode="decimal"
              placeholder={`Enter amount in ${solCurrency}`}
              value={solAmount}
              onChange={handleSolAmountChange}
              className="bg-[#171f33] border-[#2a324d] text-white"
            />
          </div>
          
          <Card className="mt-4 p-5 border-[#2a324d] bg-[#1b2035] space-y-3">
            <div className="flex justify-between items-center">
              <div className="text-gray-400">You will pay:</div>
              <div className="text-white font-medium">
                {solAmount && parseFloat(solAmount) > 0 
                  ? parseFloat(solAmount).toLocaleString(undefined, {
                    maximumFractionDigits: 6
                  }) 
                  : '0'} {solCurrency}
              </div>
            </div>
            
            <div className="pt-3 border-t border-[#2a324d]">
              <div className="flex justify-between items-center">
                <div className="text-gray-400">You will receive:</div>
                <div className="text-white font-medium">
                  {typeof tokens === 'number' ? tokens.toLocaleString(undefined, {
                    maximumFractionDigits: 2
                  }) : '0'} CLAB
                </div>
              </div>
            </div>
          </Card>
        </Tabs>
        
        <div className="flex justify-center w-full">
          <WalletButton 
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium" 
            onConnectChange={handleWalletConnectChange}
            useModal={true}
            network={currentNetwork}
            variant="default"
            isConnecting={isInitializing}
          />
        </div>
      </div>
    </>
  );
};
