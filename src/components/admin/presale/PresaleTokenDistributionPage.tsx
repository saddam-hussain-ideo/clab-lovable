import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ExclamationTriangleIcon, CheckCircledIcon } from "@radix-ui/react-icons";
import { DistributionList } from './DistributionList';
import { tokenDistributionService } from '@/services/tokenDistributionService';
import { UpdateTransactionsButton } from './UpdateTransactionsButton';
import { verifyTokenMintOwnership } from '@/utils/token/solanaToken';
import { toast } from 'sonner';
import { TokenMintingSection } from './TokenMintingSection';
import { DistributionWalletConnect } from './DistributionWalletConnect';

interface DistributionRecipient {
  id: number;
  address: string; 
  amount: number;
}

export const PresaleTokenDistributionPage = () => {
  const [tokenMintAddress, setTokenMintAddress] = useState('');
  const [pendingDistributions, setPendingDistributions] = useState<DistributionRecipient[]>([]);
  const [isOwner, setIsOwner] = useState<boolean | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [network, setNetwork] = useState(() => localStorage.getItem('activeNetwork') || 'testnet');
  const [selectedStageId, setSelectedStageId] = useState<number | null>(null);
  const [stages, setStages] = useState<any[]>([]);
  const [isDistributionStatsLoading, setIsDistributionStatsLoading] = useState(true);
  const [distributionWallet, setDistributionWallet] = useState<any>(null);
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  
  const [stats, setStats] = useState<{
    pending: { count: number; total: number; distributions: DistributionRecipient[] };
    distributed: { count: number; total: number };
    total: { count: number; total: number };
  }>({
    pending: { count: 0, total: 0, distributions: [] },
    distributed: { count: 0, total: 0 },
    total: { count: 0, total: 0 }
  });
  
  useEffect(() => {
    localStorage.setItem('activeNetwork', network);
    loadStages();
    loadDistributionData();
  }, [network]);
  
  const loadStages = async () => {
    try {
      const stages = await tokenDistributionService.fetchPresaleStages(network);
      setStages(stages);
      
      if (selectedStageId !== null && !stages.some(stage => stage.id === selectedStageId)) {
        setSelectedStageId(null);
      }
    } catch (error) {
      console.error("Error loading stages:", error);
    }
  };
  
  const loadTokenMintAddress = async () => {
    const mintAddress = await tokenDistributionService.fetchTokenMintAddress(network);
    if (mintAddress) {
      setTokenMintAddress(mintAddress);
    }
  };
  
  const loadDistributionData = async () => {
    setIsDistributionStatsLoading(true);
    try {
      await loadTokenMintAddress();
      
      const stats = await tokenDistributionService.getDistributionStats(network, selectedStageId);
      setStats(stats);
      setPendingDistributions(stats.pending.distributions || []);
    } catch (error) {
      console.error("Error loading distribution data:", error);
      toast.error("Failed to load distribution data");
    } finally {
      setIsDistributionStatsLoading(false);
    }
  };
  
  useEffect(() => {
    loadDistributionData();
  }, [selectedStageId]);
  
  const handleDistributionWalletChange = (connected: boolean, wallet: any) => {
    console.log("Distribution wallet connection changed:", { connected, wallet });
    setIsWalletConnected(connected);
    setDistributionWallet(wallet);
    
    setIsOwner(null);
  };
  
  useEffect(() => {
    const verifyOwnership = async () => {
      if (!isWalletConnected || !distributionWallet || !tokenMintAddress) {
        setIsOwner(null);
        return;
      }
      
      setIsVerifying(true);
      try {
        console.log("Verifying token ownership with wallet:", distributionWallet);
        const result = await verifyTokenMintOwnership(distributionWallet, tokenMintAddress);
        setIsOwner(result.isOwner);
        
        console.log("Ownership verification result:", result);
      } catch (error) {
        console.error("Error verifying token ownership:", error);
        setIsOwner(false);
      } finally {
        setIsVerifying(false);
      }
    };
    
    verifyOwnership();
  }, [isWalletConnected, distributionWallet, tokenMintAddress]);
  
  const handleStageChange = (stageId: string) => {
    setSelectedStageId(stageId === "all" ? null : parseInt(stageId));
  };
  
  const handleTokenMintAddressChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setTokenMintAddress(event.target.value);
  };
  
  const handleNetworkChange = (value: string) => {
    if (value === 'mainnet' || value === 'testnet') {
      setNetwork(value);
    }
  };
  
  const saveTokenMintAddress = async () => {
    if (!tokenMintAddress) {
      toast.error("Please enter a token mint address");
      return;
    }
    
    if (!tokenDistributionService.validateTokenFormat(tokenMintAddress)) {
      toast.error("Invalid token mint address format");
      return;
    }
    
    try {
      await tokenDistributionService.saveTokenMintAddress(tokenMintAddress, network);
      toast.success("Token mint address saved successfully");
      loadDistributionData();
    } catch (error) {
      console.error("Error saving token mint address:", error);
      toast.error("Failed to save token mint address");
    }
  };
  
  const handleMintSuccess = () => {
    toast.success("Tokens minted successfully. Refreshing data...");
    loadDistributionData();
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Token Distribution</h1>
          <p className="text-gray-500">Manage token distribution to presale contributors</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <UpdateTransactionsButton 
            onSuccess={loadDistributionData}
            variant="outline"
          />
          
          <Select value={network} onValueChange={handleNetworkChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select Network" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Network</SelectLabel>
                <SelectItem value="testnet">Testnet</SelectItem>
                <SelectItem value="mainnet">Mainnet</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <DistributionWalletConnect onWalletChange={handleDistributionWalletChange} />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Token Configuration</CardTitle>
            <CardDescription>
              Configure the token mint address for distribution
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Input
                  placeholder="Token Mint Address"
                  value={tokenMintAddress}
                  onChange={handleTokenMintAddressChange}
                />
                <Button onClick={saveTokenMintAddress}>Save</Button>
              </div>
              <p className="text-sm text-gray-500">
                Enter the Solana address of your token mint
              </p>
            </div>
            
            {isWalletConnected && tokenMintAddress && isOwner !== null && (
              <Alert variant={isOwner ? "default" : "destructive"}>
                {isOwner ? <CheckCircledIcon className="h-4 w-4" /> : <ExclamationTriangleIcon className="h-4 w-4" />}
                <AlertTitle>{isOwner ? "Authorized" : "Not Authorized"}</AlertTitle>
                <AlertDescription>
                  {isOwner
                    ? "Your connected wallet is the mint authority for this token."
                    : "Your connected wallet is not the mint authority for this token."}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
        
        <TokenMintingSection 
          tokenMintAddress={tokenMintAddress}
          onMintSuccess={handleMintSuccess}
          distributionWallet={distributionWallet}
          isWalletConnected={isWalletConnected}
          isOwner={isOwner}
        />
      </div>
      
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
            <div>
              <CardTitle>Distribution Management</CardTitle>
              <CardDescription>
                Manage token distribution to presale contributors
              </CardDescription>
            </div>
            
            <Select 
              value={selectedStageId === null ? "all" : selectedStageId.toString()} 
              onValueChange={handleStageChange}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by Stage" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Presale Stage</SelectLabel>
                  <SelectItem value="all">All Stages</SelectItem>
                  {stages.map(stage => (
                    <SelectItem key={stage.id} value={stage.id.toString()}>
                      {stage.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="pending">
            <TabsList className="grid grid-cols-3">
              <TabsTrigger value="pending">
                Pending ({stats.pending.count})
              </TabsTrigger>
              <TabsTrigger value="distributed">
                Distributed ({stats.distributed.count})
              </TabsTrigger>
              <TabsTrigger value="all">
                All ({stats.total.count})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="pending" className="mt-4">
              <DistributionList
                distributions={pendingDistributions}
                wallet={distributionWallet}
                tokenMintAddress={tokenMintAddress}
                onDistributionComplete={loadDistributionData}
                isLoading={isDistributionStatsLoading}
              />
            </TabsContent>
            
            <TabsContent value="distributed" className="mt-4">
              <p className="py-4">
                Total distributed: {stats.distributed.total.toLocaleString()} tokens to {stats.distributed.count} recipients
              </p>
            </TabsContent>
            
            <TabsContent value="all" className="mt-4">
              <p className="py-4">
                Total: {stats.total.total.toLocaleString()} tokens for {stats.total.count} recipients
              </p>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
