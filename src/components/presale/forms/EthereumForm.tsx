import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TokenEstimationDisplay } from '@/components/presale/TokenEstimationDisplay';
import { useAccount } from 'wagmi';

interface EthereumFormProps {
  walletAddress: string | null;
  walletType: string | null;
  ethCurrency: string;
  ethAmount: string;
  tokens: number;
  isSubmitting: boolean;
  isConnectingMetamask: boolean;
  setEthCurrency: (value: string) => void;
  handleConnectMetamask: () => Promise<void>;
  handleEthAmountChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  setWalletAddress: React.Dispatch<React.SetStateAction<string | null>>;
  setWalletType: React.Dispatch<React.SetStateAction<string | null>>;
  currentStage: any;
  stageCap: number;
}

export function EthereumForm({
  walletAddress,
  walletType,
  ethCurrency,
  ethAmount,
  tokens,
  isSubmitting,
  isConnectingMetamask,
  setEthCurrency,
  handleConnectMetamask,
  handleEthAmountChange,
  setWalletAddress,
  setWalletType,
  currentStage,
  stageCap
}: EthereumFormProps) {
  
  // Get Reown wallet connection status
  const { address: reownAddress, isConnected: isReownConnected } = useAccount();
  
  // Sync with Reown wallet if connected
  useEffect(() => {
    if (isReownConnected && reownAddress && reownAddress.startsWith('0x')) {
      // This is an Ethereum address (starts with 0x)
      console.log("[EthereumForm] Detected Reown Ethereum wallet:", reownAddress);
      setWalletAddress(reownAddress);
      setWalletType('metamask'); // Default to metamask for Ethereum addresses
    }
  }, [isReownConnected, reownAddress, setWalletAddress, setWalletType]);
  
  // Get minimum purchase amount based on currency
  const getMinStep = () => {
    if (ethCurrency === 'ETH') return '0.001'; // Minimum step for ETH
    return '1'; // Minimum step for USDC/USDT
  };
  
  return (
    <div className="space-y-4">
      {/* Amount input with currency selection */}
      <div>
        <Label htmlFor="amount" className="text-sm font-medium">Amount</Label>
        <div className="flex gap-2 mt-1">
          <Select value={ethCurrency} onValueChange={setEthCurrency}>
            <SelectTrigger className="w-[160px] h-10 bg-background/10 border-white/10 focus:border-purple-500 focus:ring-purple-500">
              <SelectValue placeholder="Currency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ETH">ETH</SelectItem>
              <SelectItem value="USDC">USDC</SelectItem>
              <SelectItem value="USDT">USDT</SelectItem>
            </SelectContent>
          </Select>
          
          <Input
            id="amount"
            type="number"
            min="0"
            step={getMinStep()}
            value={ethAmount}
            onChange={handleEthAmountChange}
            placeholder={`Enter amount`}
            className="flex-1 h-10 bg-background/10 border-white/10 focus:border-purple-500 focus:ring-purple-500"
          />
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Minimum: {ethCurrency === 'ETH' ? '0.001 ETH' : `1 ${ethCurrency}`}
        </p>
      </div>
      
      {/* Token estimation display */}
      <TokenEstimationDisplay
        tokenAmount={tokens}
        currency={ethCurrency}
        inputAmount={ethAmount}
        loading={isSubmitting}
      />
      
      {/* Display wallet address when connected */}
      {isReownConnected && reownAddress && reownAddress.startsWith('0x') && (
        <div className="text-sm text-purple-400 mt-1 flex items-center gap-1">
          <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
          Connected: {reownAddress.substring(0, 6)}...{reownAddress.substring(reownAddress.length - 4)}
        </div>
      )}
    </div>
  );
}
