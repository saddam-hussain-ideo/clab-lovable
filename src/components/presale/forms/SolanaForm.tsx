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
import { AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAccount } from 'wagmi';
import { WalletType } from '@/services/wallet/walletService';

interface SolanaFormProps {
  walletAddress: string | null;
  walletType: string | null;
  solCurrency: string;
  solAmount: string;
  tokens: number;
  isSubmitting: boolean;
  isConnectingSol: boolean;
  setSolCurrency: (value: string) => void;
  setSolAmount: (value: string) => void;
  handleConnectPhantom: () => Promise<void>;
  handleSolAmountChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  setWalletAddress: React.Dispatch<React.SetStateAction<string | null>>;
  setWalletType: React.Dispatch<React.SetStateAction<string | null>>;
  currentStage: any;
  stageCap: number;
}

export function SolanaForm({
  walletAddress,
  walletType,
  solCurrency,
  solAmount,
  tokens,
  isSubmitting,
  isConnectingSol,
  setSolCurrency,
  handleConnectPhantom,
  handleSolAmountChange,
  setWalletAddress,
  setWalletType,
  currentStage,
  stageCap
}: SolanaFormProps) {
  
  // Check if using Alchemy or custom RPC
  const hasCustomRpc = localStorage.getItem('customSolanaRpcUrl') || localStorage.getItem('alchemyApiKey');
  
  // Get Reown wallet connection status
  const { address: reownAddress, isConnected: isReownConnected } = useAccount();
  
  // Handle global wallet connection events
  useEffect(() => {
    const handleGlobalWalletConnect = (event: CustomEvent) => {
      const { connected, address, walletType: type } = event.detail;
      console.log("[SolanaForm] Global wallet connection event:", { connected, address, type });
      
      if (connected && address) {
        setWalletAddress(address);
        setWalletType(type);
      }
    };

    window.addEventListener('globalWalletConnected', handleGlobalWalletConnect as EventListener);
    return () => {
      window.removeEventListener('globalWalletConnected', handleGlobalWalletConnect as EventListener);
    };
  }, [setWalletAddress, setWalletType]);

  // Sync with Reown wallet if connected
  useEffect(() => {
    if (isReownConnected && reownAddress) {
      // Only update if the address is different or wallet is not connected
      if (reownAddress !== walletAddress || !walletType) {
        console.log("[SolanaForm] Syncing with Reown wallet:", reownAddress);
        setWalletAddress(reownAddress);
        setWalletType('reown');
      }
    } else if (!isReownConnected && walletType === 'reown') {
      // Clear wallet if Reown disconnects
      console.log("[SolanaForm] Reown wallet disconnected");
      setWalletAddress(null);
      setWalletType(null);
    }
  }, [isReownConnected, reownAddress, walletAddress, walletType, setWalletAddress, setWalletType]);
  
  // Get minimum purchase amount based on currency
  const getMinStep = () => {
    if (solCurrency === 'SOL') return '0.001'; // Updated minimum step for SOL
    return '1'; // Minimum step for USDC/USDT
  };
  
  return (
    <div className="space-y-4">
      {/* Amount input with currency selection */}
      <div>
        <Label htmlFor="amount" className="text-sm font-medium">Amount</Label>
        <div className="flex gap-2 mt-1">
          <Select value={solCurrency} onValueChange={setSolCurrency}>
            <SelectTrigger className="w-[160px] h-10 bg-background/10 border-white/10 focus:border-purple-500 focus:ring-purple-500">
              <SelectValue placeholder="Currency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="SOL">SOL</SelectItem>
              <SelectItem value="USDC">USDC</SelectItem>
              <SelectItem value="USDT">USDT</SelectItem>
            </SelectContent>
          </Select>
          
          <Input
            id="amount"
            type="number"
            min="0"
            step={getMinStep()}
            value={solAmount}
            onChange={handleSolAmountChange}
            placeholder={`Enter amount`}
            className="flex-1 h-10 bg-background/10 border-white/10 focus:border-purple-500 focus:ring-purple-500"
          />
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Minimum: {solCurrency === 'SOL' ? '0.001 SOL' : `1 ${solCurrency}`}
        </p>
      </div>
      
      {/* Token estimation display */}
      <TokenEstimationDisplay
        tokenAmount={tokens}
        currency={solCurrency}
        inputAmount={solAmount}
        loading={isSubmitting}
      />
    </div>
  );
}
