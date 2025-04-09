import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle, Info, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { WalletButton } from "@/components/wallet/WalletButton";
import { isValidSolanaAddress } from "@/utils/wallet";
import { getTokenMetadata } from "@/utils/token/tokenMetadata";

export interface PresaleDistributionProps {
  isPresaleActive: boolean;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  refetchSettings: () => void;
  activeNetwork: string;
  onNetworkChange: (network: string) => void;
  presaleSettings: any;
  contributions: any[];
}

export const PresaleDistribution: React.FC<PresaleDistributionProps> = ({
  isPresaleActive,
  isLoading,
  setIsLoading,
  refetchSettings,
  activeNetwork,
  onNetworkChange,
  presaleSettings,
  contributions
}) => {
  const [walletConnected, setWalletConnected] = useState(false);
  const [tokenMintAddress, setTokenMintAddress] = useState("");
  const [isTokenValid, setIsTokenValid] = useState(false);
  const [tokenMetadata, setTokenMetadata] = useState<any>(null);
  const [distributionAddress, setDistributionAddress] = useState("");
  const [distributionAmount, setDistributionAmount] = useState("");
  const [validatingToken, setValidatingToken] = useState(false);
  const [distributionInProgress, setDistributionInProgress] = useState(false);
  const [selectedStage, setSelectedStage] = useState<string>("all");
  
  const { data: presaleStages, isLoading: stagesLoading } = useQuery({
    queryKey: ['presaleStages', activeNetwork],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('presale_stages')
        .select('*')
        .eq('network', activeNetwork)
        .order('order_number', { ascending: true });
      
      if (error) throw error;
      return data || [];
    }
  });
  
  useEffect(() => {
    const validateToken = async () => {
      if (tokenMintAddress && tokenMintAddress.length > 30) {
        try {
          const isValid = isValidSolanaAddress(tokenMintAddress);
          setIsTokenValid(isValid);
          
          if (isValid) {
            setValidatingToken(true);
            try {
              const metadata = await getTokenMetadata(tokenMintAddress);
              setTokenMetadata(metadata);
              toast.success(`Token verified: ${metadata.name} (${metadata.symbol})`);
            } catch (error) {
              console.error("Error fetching token metadata:", error);
            } finally {
              setValidatingToken(false);
            }
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
  }, [tokenMintAddress]);
  
  const handleDistributeTokens = async () => {
    if (!tokenMintAddress || !distributionAddress || !distributionAmount) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (!walletConnected) {
      toast.error("Please connect your wallet to perform this action");
      return;
    }
    
    if (!isTokenValid) {
      toast.error("Please enter a valid token mint address");
      return;
    }

    setDistributionInProgress(true);
    try {
      // Simulate token distribution
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success("Token distribution completed", {
        description: `Successfully sent ${distributionAmount} tokens to ${distributionAddress.substring(0, 6)}...${distributionAddress.substring(distributionAddress.length - 4)}`
      });
      
      setDistributionAmount("");
      setDistributionAddress("");
    } catch (error: any) {
      toast.error("Failed to distribute tokens", {
        description: error.message
      });
    } finally {
      setDistributionInProgress(false);
    }
  };
  
  const handleBatchDistribute = async () => {
    if (!tokenMintAddress) {
      toast.error("Please enter a token mint address");
      return;
    }

    if (!isTokenValid) {
      toast.error("Please enter a valid token mint address");
      return;
    }

    if (!walletConnected) {
      toast.error("Please connect your wallet to perform this action");
      return;
    }
    
    setDistributionInProgress(true);
    try {
      // Simulate batch distribution
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const filteredContributions = selectedStage === "all" 
        ? contributions 
        : contributions.filter(c => c.stage_id === parseInt(selectedStage));
      
      toast.success("Batch distribution completed", {
        description: `Successfully distributed tokens to ${filteredContributions.length} wallets`
      });
    } catch (error: any) {
      toast.error("Failed to perform batch distribution", {
        description: error.message
      });
    } finally {
      setDistributionInProgress(false);
    }
  };
  
  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold">Token Distribution</h2>
        
        <div className="flex items-center gap-2">
          <Badge variant={activeNetwork === 'mainnet' ? 'default' : 'secondary'}>
            {activeNetwork === 'mainnet' ? 'Mainnet' : 'Testnet'}
          </Badge>
          
          <Badge 
            variant="outline" 
            className="cursor-pointer hover:bg-secondary"
            onClick={() => onNetworkChange(activeNetwork === 'mainnet' ? 'testnet' : 'mainnet')}
          >
            Switch to {activeNetwork === 'mainnet' ? 'Testnet' : 'Mainnet'}
          </Badge>
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row gap-4 mb-4">
        <Card className="flex-1">
          <CardHeader>
            <CardTitle>Wallet Connection</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div>
                {walletConnected ? (
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
                onConnectChange={(connected) => setWalletConnected(connected)}
                className="ml-2"
              />
            </div>
          </CardContent>
        </Card>
        
        <Card className="flex-1">
          <CardHeader>
            <CardTitle>Presale Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${isPresaleActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span>Presale is {isPresaleActive ? 'Active' : 'Inactive'}</span>
              </div>
              
              <Switch 
                checked={isPresaleActive} 
                disabled={true}
              />
            </div>
            
            {!isPresaleActive && (
              <p className="text-sm text-amber-500 mt-2">
                Note: Presale must be active to distribute tokens
              </p>
            )}
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Token Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="manual" className="w-full">
            <TabsList className="grid grid-cols-2 mb-4">
              <TabsTrigger value="manual">Manual Distribution</TabsTrigger>
              <TabsTrigger value="batch">Batch Distribution</TabsTrigger>
            </TabsList>
            
            <TabsContent value="manual" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tokenMintAddress">Token Mint Address</Label>
                <div className="flex space-x-2">
                  <Input
                    id="tokenMintAddress"
                    value={tokenMintAddress}
                    onChange={(e) => setTokenMintAddress(e.target.value)}
                    placeholder="Enter token mint address"
                    className={isTokenValid ? "border-green-500 focus-visible:ring-green-500" : ""}
                  />
                  {validatingToken && <Loader2 className="animate-spin h-6 w-6" />}
                  {isTokenValid && !validatingToken && <CheckCircle className="text-green-500 w-6 h-6" />}
                </div>
                {tokenMintAddress && tokenMintAddress.length > 30 && !isTokenValid && (
                  <p className="text-sm text-red-500 mt-1">Please enter a valid Solana token mint address</p>
                )}
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
              
              <Separator className="my-4" />
              
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
                disabled={distributionInProgress || !walletConnected || !isTokenValid || !distributionAddress || !distributionAmount}
                className="w-full"
              >
                {distributionInProgress ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Distribute Tokens"
                )}
              </Button>
              
              <div className="bg-muted/50 p-4 rounded-md mt-4">
                <div className="flex items-center gap-2">
                  <Info className="h-5 w-5 text-blue-500" />
                  <p className="text-sm text-muted-foreground">
                    Please verify all details before distributing tokens. This action cannot be undone.
                  </p>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="batch" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tokenMintAddressBatch">Token Mint Address</Label>
                <div className="flex space-x-2">
                  <Input
                    id="tokenMintAddressBatch"
                    value={tokenMintAddress}
                    onChange={(e) => setTokenMintAddress(e.target.value)}
                    placeholder="Enter token mint address"
                    className={isTokenValid ? "border-green-500 focus-visible:ring-green-500" : ""}
                  />
                  {validatingToken && <Loader2 className="animate-spin h-6 w-6" />}
                  {isTokenValid && !validatingToken && <CheckCircle className="text-green-500 w-6 h-6" />}
                </div>
                {tokenMintAddress && tokenMintAddress.length > 30 && !isTokenValid && (
                  <p className="text-sm text-red-500 mt-1">Please enter a valid Solana token mint address</p>
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
                    {presaleStages && presaleStages.map((stage: any) => (
                      <SelectItem key={stage.id} value={stage.id.toString()}>{stage.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="p-4 bg-muted/30 rounded-lg">
                <h3 className="font-medium mb-2">Distribution Summary</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Total Eligible Wallets:</span>
                    <span>{selectedStage === "all" 
                      ? contributions.length 
                      : contributions.filter(c => c.stage_id === parseInt(selectedStage)).length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Total Tokens to Distribute:</span>
                    <span>{selectedStage === "all" 
                      ? contributions.reduce((sum, c) => sum + (parseFloat(c.token_amount) || 0), 0).toLocaleString() 
                      : contributions
                          .filter(c => c.stage_id === parseInt(selectedStage))
                          .reduce((sum, c) => sum + (parseFloat(c.token_amount) || 0), 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>
              
              <Button
                onClick={handleBatchDistribute}
                disabled={distributionInProgress || !walletConnected || !isTokenValid}
                className="w-full"
              >
                {distributionInProgress ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing Batch Distribution...
                  </>
                ) : (
                  "Start Batch Distribution"
                )}
              </Button>
              
              <Alert variant="default" className="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
                <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <AlertDescription>
                  This will distribute tokens to all eligible wallets from presale purchases. 
                  Please ensure your wallet has sufficient token balance before proceeding.
                </AlertDescription>
              </Alert>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
