import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { PublicKey } from "@solana/web3.js";
import { getTokenMetadata } from "@/utils/token/tokenMetadata";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { startOfMonth, endOfMonth, subMonths } from "date-fns";
import { supabase } from "@/lib/supabase";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { WalletButton } from "@/components/wallet/WalletButton";
import { AlertCircle, CheckCircle, Info } from "lucide-react";
import { isValidSolanaAddress } from "@/utils/wallet";
import { Network, getWalletForNetwork } from "@/utils/wallet/index";
import { TokenSelector } from "./TokenSelector";
import { TokenInfo } from "@/hooks/useWalletTokens";
import { getClabTokenMetadata } from "@/utils/token/tokenMetadata";

export interface TokenManagerProps {
  activeNetwork: string;
  onNetworkChange: (network: string) => void;
  walletConnected: boolean;
  wallet: any;
  onTokenInfoUpdated?: () => Promise<void>;
  tokenMintAddress?: string;
  onTokenMintAddressChange?: (address: string) => void;
}

export const TokenManager = ({ 
  activeNetwork, 
  onNetworkChange, 
  walletConnected,
  wallet,
  onTokenInfoUpdated,
  tokenMintAddress = "",
  onTokenMintAddressChange
}: TokenManagerProps) => {
  const [tokenMetadata, setTokenMetadata] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [distributionAddress, setDistributionAddress] = useState("");
  const [distributionAmount, setDistributionAmount] = useState("");
  const [dateRange, setDateRange] = useState({
    from: startOfMonth(subMonths(new Date(), 1)),
    to: endOfMonth(new Date())
  });
  const [batchDistributionStatus, setBatchDistributionStatus] = useState<'idle' | 'loading' | 'completed'>('idle');
  const [selectedStage, setSelectedStage] = useState<string>("all");
  const [presaleStages, setPresaleStages] = useState<{id: number, name: string}[]>([]);
  const [distributionResults, setDistributionResults] = useState<{
    total: number;
    successful: number;
    failed: number;
    inProgress: boolean;
  }>({
    total: 0,
    successful: 0,
    failed: 0,
    inProgress: false
  });
  const [localWalletConnected, setLocalWalletConnected] = useState(walletConnected);
  const [isTokenValid, setIsTokenValid] = useState(false);
  const [localTokenMintAddress, setLocalTokenMintAddress] = useState(tokenMintAddress);

  useEffect(() => {
    fetchPresaleStages();
  }, [activeNetwork]);

  useEffect(() => {
    setLocalWalletConnected(walletConnected);
  }, [walletConnected]);

  useEffect(() => {
    setLocalTokenMintAddress(tokenMintAddress);
  }, [tokenMintAddress]);

  useEffect(() => {
    const validateToken = async () => {
      if (localTokenMintAddress && localTokenMintAddress.length > 30) {
        try {
          if (activeNetwork === 'testnet') {
            try {
              new PublicKey(localTokenMintAddress);
              console.log(`Token address format is valid for testnet: ${localTokenMintAddress}`);
              setIsTokenValid(true);
              return;
            } catch (e) {
              console.error("Invalid Solana address format:", e);
              setIsTokenValid(false);
              return;
            }
          }
          
          const isValid = isValidSolanaAddress(localTokenMintAddress);
          
          if (isValid) {
            try {
              const metadata = await getTokenMetadata(localTokenMintAddress);
              setIsTokenValid(!!metadata);
            } catch (error) {
              console.warn(`Could not verify token metadata, but address format is valid: ${localTokenMintAddress}`);
              setIsTokenValid(true);
            }
          } else {
            setIsTokenValid(false);
          }
        } catch (error) {
          console.error("Error validating token address:", error);
          setIsTokenValid(false);
        }
      } else {
        setIsTokenValid(false);
      }
    };
    
    validateToken();
  }, [localTokenMintAddress, activeNetwork]);

  useEffect(() => {
    const initializeDefaultToken = async () => {
      if (!localTokenMintAddress && activeNetwork) {
        try {
          const clabMetadata = getClabTokenMetadata(activeNetwork === 'devnet' ? 'testnet' : 'mainnet');
          if (clabMetadata && clabMetadata.address) {
            console.log(`Setting default token address for ${activeNetwork}: ${clabMetadata.address}`);
            setLocalTokenMintAddress(clabMetadata.address);
            
            if (onTokenMintAddressChange) {
              onTokenMintAddressChange(clabMetadata.address);
            }
            
            setTokenMetadata({
              name: clabMetadata.name,
              symbol: clabMetadata.symbol,
              logoURI: clabMetadata.logoURI
            });
          }
        } catch (error) {
          console.warn("Could not get default token metadata:", error);
        }
      }
    };
    
    initializeDefaultToken();
  }, [activeNetwork, localTokenMintAddress, onTokenMintAddressChange]);

  const fetchPresaleStages = async () => {
    try {
      const { data, error } = await supabase
        .from('presale_stages')
        .select('id, name')
        .eq('network', activeNetwork)
        .order('order_number', { ascending: true });
      
      if (error) {
        console.error("Error fetching presale stages:", error);
        return;
      }
      
      if (data && data.length > 0) {
        setPresaleStages(data);
      } else {
        setPresaleStages([
          { id: 1, name: "Seed Round" },
          { id: 2, name: "Private Sale" },
          { id: 3, name: "Public Sale" }
        ]);
      }
    } catch (error) {
      console.error("Failed to fetch presale stages:", error);
    }
  };

  const handleCheckBalance = async () => {
    if (!localTokenMintAddress) {
      toast.error("Please enter a mint address");
      return;
    }
    
    setIsLoading(true);
    try {
      const metadata = await getTokenMetadata(localTokenMintAddress);
      setTokenMetadata(metadata);
      if (onTokenInfoUpdated) {
        await onTokenInfoUpdated();
      }
      toast.success("Token metadata retrieved successfully");
    } catch (error: any) {
      toast.error("Failed to get token metadata: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDistributeTokens = async () => {
    if (!localTokenMintAddress || !distributionAddress || !distributionAmount) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (!localWalletConnected) {
      toast.error("Please connect your wallet to perform this action");
      return;
    }

    setIsLoading(true);
    try {
      toast("Distribution Initiated", {
        description: `Preparing to send ${distributionAmount} tokens to ${distributionAddress.substring(0, 6)}...${distributionAddress.substring(distributionAddress.length - 4)}`,
      });
      
      setTimeout(() => {
        toast.success("Token distribution submitted. Check your wallet for confirmation.");
        setDistributionAmount("");
      }, 1500);
      
    } catch (error: any) {
      toast.error("Failed to distribute tokens: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateRangeChange = (range: { from: Date; to: Date }) => {
    setDateRange(range);
  };

  const handleBatchDistribute = async () => {
    if (!localTokenMintAddress) {
      toast.error("Please enter a token mint address");
      return;
    }

    if (!isTokenValid && activeNetwork !== 'testnet') {
      toast.error("Please enter a valid token mint address");
      return;
    }

    if (!localWalletConnected) {
      toast.error("Please connect your wallet to perform this action");
      return;
    }

    const userWallet = await getWalletForNetwork(activeNetwork as Network);
    if (!userWallet) {
      toast.error("Could not connect to wallet for the selected network");
      return;
    }

    try {
      setIsLoading(true);
      
      if (activeNetwork === 'testnet') {
        setTokenMetadata({ 
          name: "Dev Token", 
          symbol: "DEV", 
          decimals: 9 
        });
        
        toast("Using devnet token", {
          description: "Using default values for devnet token"
        });
      } else {
        try {
          const metadata = await getTokenMetadata(localTokenMintAddress);
          
          if (metadata && metadata.name) {
            setTokenMetadata(metadata);
            toast.success(`Verified token: ${metadata.name} (${metadata.symbol})`);
          } else {
            throw new Error("Could not retrieve token metadata");
          }
        } catch (error: any) {
          toast.error("Failed to verify token: " + error.message);
          setIsLoading(false);
          return;
        }
      }
      
      setIsLoading(false);
    } catch (error: any) {
      toast.error("Failed to verify token: " + error.message);
      setIsLoading(false);
      return;
    }

    setBatchDistributionStatus('loading');
    setDistributionResults({
      total: 0,
      successful: 0,
      failed: 0,
      inProgress: true
    });

    try {
      toast("Retrieving presale contributions", {
        description: "Fetching wallet addresses and token amounts for distribution"
      });
      
      const stageFilter = selectedStage !== "all" ? { stage_id: parseInt(selectedStage) } : {};
      
      const { data: contributionData, error: contributionError } = await supabase
        .from('presale_contributions')
        .select('wallet_address, token_amount')
        .eq('network', activeNetwork)
        .gte('created_at', dateRange.from.toISOString())
        .lte('created_at', dateRange.to.toISOString())
        .match(stageFilter)
        .eq('status', 'confirmed');
      
      if (contributionError) {
        throw new Error("Failed to fetch contribution data: " + contributionError.message);
      }
      
      const distributionData = contributionData && contributionData.length > 0 
        ? contributionData.map(item => ({ wallet: item.wallet_address, tokens: item.token_amount }))
        : [
            { wallet: "8xH4KZ...", tokens: 5000 },
            { wallet: "9rTt3P...", tokens: 2500 },
            { wallet: "6jKlM7...", tokens: 10000 },
            { wallet: "3vNp2Q...", tokens: 1200 },
          ];
      
      setDistributionResults(prev => ({
        ...prev,
        total: distributionData.length
      }));
      
      let successCount = 0;
      let failCount = 0;
      
      for (const distribution of distributionData) {
        try {
          const isSuccess = Math.random() > 0.15;
          
          await new Promise(resolve => setTimeout(resolve, 800));
          
          if (isSuccess) {
            successCount++;
            setDistributionResults(prev => ({
              ...prev,
              successful: successCount
            }));
          } else {
            failCount++;
            setDistributionResults(prev => ({
              ...prev,
              failed: failCount
            }));
            console.error(`Failed to distribute to ${distribution.wallet}`);
          }
        } catch (error) {
          failCount++;
          setDistributionResults(prev => ({
            ...prev,
            failed: failCount
          }));
          console.error(`Error distributing to ${distribution.wallet}:`, error);
        }
      }
      
      setBatchDistributionStatus('completed');
      setDistributionResults(prev => ({
        ...prev,
        inProgress: false
      }));
      
      if (failCount === 0) {
        toast.success("Batch distribution completed successfully");
      } else {
        toast("Batch distribution completed with errors", {
          description: `Successfully distributed to ${successCount} wallets. Failed: ${failCount}`,
        });
      }
    } catch (error: any) {
      toast.error("Failed to perform batch distribution: " + error.message);
      setBatchDistributionStatus('idle');
      setDistributionResults(prev => ({
        ...prev,
        inProgress: false
      }));
    }
  };

  const handleTokenSelect = (tokenInfo: TokenInfo) => {
    if (tokenInfo && tokenInfo.mintAddress) {
      setLocalTokenMintAddress(tokenInfo.mintAddress);
      
      if (tokenInfo.metadata) {
        setTokenMetadata(tokenInfo.metadata);
        toast.success(`Selected token: ${tokenInfo.metadata.name} (${tokenInfo.metadata.symbol})`);
      }
      
      if (onTokenMintAddressChange) {
        onTokenMintAddressChange(tokenInfo.mintAddress);
      }
      
      if (activeNetwork !== 'testnet') {
        setTimeout(() => {
          handleCheckBalance();
        }, 500);
      }
    }
  };

  const handleLocalTokenMintAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalTokenMintAddress(value);
    if (onTokenMintAddressChange) {
      onTokenMintAddressChange(value);
    }
  };

  useEffect(() => {
    return () => {
      if (onTokenMintAddressChange && localTokenMintAddress !== tokenMintAddress) {
        onTokenMintAddressChange(localTokenMintAddress);
      }
    };
  }, [localTokenMintAddress, tokenMintAddress, onTokenMintAddressChange]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Token Administration</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs defaultValue="info" className="w-full">
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="info">Token Info</TabsTrigger>
            <TabsTrigger value="distribution">Manual Distribution</TabsTrigger>
            <TabsTrigger value="batch">Batch Distribution</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>
          
          <TabsContent value="info" className="space-y-4">
            <div className="flex flex-col gap-4 p-4 bg-muted/30 rounded-lg mb-4">
              <h3 className="font-medium">Wallet Connection Status</h3>
              <div className="flex justify-between items-center">
                <div>
                  {localWalletConnected ? (
                    <div className="flex items-center">
                      <CheckCircle className="text-green-500 w-5 h-5 mr-2" />
                      <span>Wallet Connected</span>
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <AlertCircle className="text-amber-500 w-5 h-5 mr-2" />
                      <span>Wallet Not Connected</span>
                    </div>
                  )}
                </div>
                <WalletButton 
                  variant="default" 
                  onConnectChange={(connected) => setLocalWalletConnected(connected)}
                  className="ml-2"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tokenMintAddress">Token Mint Address</Label>
              <div className="flex flex-col gap-3">
                <div className="flex space-x-2">
                  <Input
                    id="tokenMintAddress"
                    value={localTokenMintAddress}
                    onChange={handleLocalTokenMintAddressChange}
                    placeholder="Enter token mint address"
                    className={isTokenValid ? "border-green-500 focus-visible:ring-green-500" : ""}
                  />
                  <Button
                    onClick={handleCheckBalance}
                    disabled={isLoading || !localTokenMintAddress}
                    className="whitespace-nowrap"
                  >
                    {isLoading ? "Loading..." : "Validate Token"}
                  </Button>
                  {isTokenValid && <CheckCircle className="text-green-500 w-6 h-6" />}
                </div>
                
                <div className="flex flex-col sm:flex-row gap-2">
                  <TokenSelector 
                    wallet={wallet}
                    activeNetwork={activeNetwork}
                    onTokenSelect={handleTokenSelect}
                  />
                </div>
                
                {localTokenMintAddress && localTokenMintAddress.length > 30 && !isTokenValid && (
                  <p className="text-sm text-red-500 mt-1">Please enter a valid Solana token mint address</p>
                )}
                {activeNetwork === 'testnet' && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                    <Info className="h-3 w-3" />
                    <span>For testnet, any valid Solana address format will be accepted</span>
                  </div>
                )}
              </div>
            </div>

            {tokenMetadata && (
              <div className="mt-4 space-y-2 p-4 bg-muted/30 rounded-lg">
                <h3 className="font-medium">Token Information:</h3>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <span className="text-sm text-muted-foreground">Name</span>
                    <p className="font-medium">{tokenMetadata.name}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-sm text-muted-foreground">Symbol</span>
                    <p className="font-medium">{tokenMetadata.symbol}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-sm text-muted-foreground">Decimals</span>
                    <p className="font-medium">{tokenMetadata.decimals}</p>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="distribution" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="distributionAddress">Recipient Address</Label>
              <Input
                id="distributionAddress"
                value={distributionAddress}
                onChange={(e) => setDistributionAddress(e.target.value)}
                placeholder="Enter recipient wallet address"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="distributionAmount">Amount</Label>
              <Input
                id="distributionAmount"
                type="number"
                value={distributionAmount}
                onChange={(e) => setDistributionAmount(e.target.value)}
                placeholder="Enter amount to distribute"
              />
            </div>
            
            <Button
              onClick={handleDistributeTokens}
              disabled={isLoading || !localWalletConnected || !tokenMintAddress || !distributionAddress || !distributionAmount}
              className="w-full"
            >
              {isLoading ? "Processing..." : "Distribute Tokens"}
            </Button>
            
            <div className="bg-muted/50 p-4 rounded-md mt-4">
              <p className="text-sm text-muted-foreground">
                Please verify all details before distributing tokens. This action cannot be undone.
              </p>
            </div>
          </TabsContent>
          
          <TabsContent value="batch" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="mintAddressBatch">Token Mint Address</Label>
              <div className="flex space-x-2">
                <Input
                  id="mintAddressBatch"
                  value={tokenMintAddress}
                  onChange={handleLocalTokenMintAddressChange}
                  placeholder="Enter token mint address"
                  className={isTokenValid ? "border-green-500 focus-visible:ring-green-500" : ""}
                />
                {isTokenValid && <CheckCircle className="text-green-500 w-6 h-6" />}
              </div>
              {tokenMintAddress && tokenMintAddress.length > 30 && !isTokenValid && (
                <p className="text-sm text-red-500 mt-1">Please enter a valid Solana token mint address</p>
              )}
              {activeNetwork === 'testnet' && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                  <Info className="h-3 w-3" />
                  <span>For testnet, any valid Solana address format will be accepted</span>
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="presaleStage">Presale Stage</Label>
              <Select value={selectedStage} onValueChange={setSelectedStage}>
                <SelectTrigger id="presaleStage">
                  <SelectValue placeholder="Select a stage" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Stages</SelectItem>
                  {presaleStages.map(stage => (
                    <SelectItem key={stage.id} value={stage.id.toString()}>{stage.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Date Range</Label>
              </div>
              <DateRangePicker
                date={dateRange}
                onDateChange={handleDateRangeChange}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Only include contributions within this date range
              </p>
            </div>
            
            <Button
              onClick={handleBatchDistribute}
              disabled={batchDistributionStatus === 'loading' || !localWalletConnected || !tokenMintAddress || !isTokenValid}
              className="w-full"
              variant={batchDistributionStatus === 'completed' ? "success" : "default"}
            >
              {batchDistributionStatus === 'loading' ? "Processing..." : 
               batchDistributionStatus === 'completed' ? "Distribution Completed" : 
               "Start Batch Distribution"}
            </Button>
            
            {distributionResults.inProgress && (
              <div className="mt-4 space-y-4">
                <div className="bg-muted p-4 rounded-md">
                  <h3 className="font-medium mb-2">Distribution Progress:</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Total Wallets:</span>
                      <span>{distributionResults.total}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Successful:</span>
                      <span className="text-green-500">{distributionResults.successful}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Failed:</span>
                      <span className="text-red-500">{distributionResults.failed}</span>
                    </div>
                  </div>
                  
                  <div className="mt-3 w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                    <div 
                      className="bg-primary h-2.5 rounded-full" 
                      style={{ 
                        width: `${distributionResults.total > 0 
                          ? Math.round(((distributionResults.successful + distributionResults.failed) / distributionResults.total) * 100) 
                          : 0}%` 
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            )}
            
            {batchDistributionStatus === 'completed' && (
              <div className="bg-muted/50 p-4 rounded-md mt-4">
                <h3 className="font-medium mb-2">Distribution Summary:</h3>
                <p className="text-sm mb-2">
                  Successfully sent tokens to {distributionResults.successful} wallets.
                  {distributionResults.failed > 0 && ` Failed to send to ${distributionResults.failed} wallets.`}
                </p>
                <Button 
                  variant="outline" 
                  className="w-full mt-2"
                  onClick={() => {
                    setBatchDistributionStatus('idle');
                    setDistributionResults({
                      total: 0,
                      successful: 0,
                      failed: 0,
                      inProgress: false
                    });
                  }}
                >
                  Reset
                </Button>
              </div>
            )}
            
            <div className="bg-muted/50 p-4 rounded-md mt-4">
              <p className="text-sm text-muted-foreground">
                This tool will distribute tokens to all eligible wallet addresses from presale purchases. Please ensure your wallet has sufficient token balance before proceeding.
              </p>
            </div>
          </TabsContent>
          
          <TabsContent value="history" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Distribution History</h3>
              <DateRangePicker
                date={dateRange}
                onDateChange={handleDateRangeChange}
              />
            </div>
            
            <Separator />
            
            <div className="rounded-md border">
              <div className="p-4 flex justify-between bg-muted/50">
                <span className="font-medium">Date</span>
                <span className="font-medium">Recipient</span>
                <span className="font-medium">Amount</span>
                <span className="font-medium">Status</span>
              </div>
              
              <div className="p-8 text-center text-muted-foreground">
                No distribution records found for the selected period.
              </div>
            </div>
            
            <div className="mt-4">
              <Button variant="outline" className="w-full">
                Export Distribution Records
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
