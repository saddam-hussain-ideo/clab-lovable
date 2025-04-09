
import React, { useState, useEffect } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/hooks/useWallet";
import { Loader2 } from "lucide-react";
import { WalletConnectOptions } from "./WalletConnectOptions";
import { PopoverClose } from "@radix-ui/react-popover"
import { WalletType } from "@/services/wallet/walletService";
import { logDebug } from "@/utils/debugLogging";

interface WalletOptionsProps {
  children: React.ReactNode;
  onConnect?: (connected: boolean, address: string | null, type?: WalletType | null) => void;
  disabled?: boolean;
  className?: string;
  isConnecting?: boolean;
  setIsConnecting?: (connecting: boolean) => void;
  network?: 'mainnet' | 'testnet';
  forcePrompt?: boolean;
}

export const WalletOptions = ({ 
  children, 
  onConnect, 
  disabled = false,
  className = "",
  isConnecting = false,
  setIsConnecting,
  network = 'testnet',
  forcePrompt = true // Default to true to always force prompt
}: WalletOptionsProps) => {
  const [open, setOpen] = useState(false);
  
  useEffect(() => {
    if (open) {
      logDebug('WALLET', `WalletOptions popover opened with forcePrompt=${forcePrompt}`);
    }
  }, [open, forcePrompt]);
  
  const handleWalletConnect = (connected: boolean, address: string | null, type?: WalletType | null) => {
    if (onConnect) {
      onConnect(connected, address, type);
    }
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          className={className}
          disabled={disabled || isConnecting}
        >
          {isConnecting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              <span>Connecting...</span>
            </>
          ) : (
            children
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[250px] p-4 rounded-xl" align="center">
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Connect Wallet</h4>
            <p className="text-xs text-muted-foreground">
              Select a wallet to connect
            </p>
          </div>
          
          <WalletConnectOptions 
            onConnect={handleWalletConnect}
            network={network}
            forcePrompt={forcePrompt} // Pass the forcePrompt parameter
          />
          
          <PopoverClose asChild>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2"
            >
              Cancel
            </Button>
          </PopoverClose>
        </div>
      </PopoverContent>
    </Popover>
  );
};
