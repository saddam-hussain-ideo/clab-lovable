
import React, { useState } from 'react';
import { Wallet, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatWalletAddress } from "@/utils/wallet/formatWalletAddress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { clearWalletState } from "@/utils/wallet";
import { WalletType } from "@/services/wallet/walletService";

interface WalletDisplayProps {
  walletAddress: string;
  walletType?: WalletType | null;
  onDisconnect?: () => void;
  variant?: "default" | "compact" | "header";
  showIcon?: boolean;
}

export const WalletDisplay = ({ 
  walletAddress, 
  walletType = 'phantom', 
  onDisconnect,
  variant = "default",
  showIcon = true
}: WalletDisplayProps) => {
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  
  // Format display based on variant
  const getDisplayAddress = () => {
    switch(variant) {
      case "compact":
        return formatWalletAddress(walletAddress, 3, 3);
      case "header":
        return formatWalletAddress(walletAddress, 4, 4);
      default:
        return formatWalletAddress(walletAddress, 6, 4);
    }
  };
  
  // Wallet type formatting
  const getWalletDisplayName = (type: string | null): string => {
    if (!type) return "Wallet";
    
    switch (type.toLowerCase()) {
      case 'phantom': return 'Phantom';
      case 'solflare': return 'Solflare';
      case 'phantom_ethereum': return 'Phantom (Ethereum)';
      case 'metamask': return 'MetaMask';
      default: return type;
    }
  };
  
  const handleDisconnect = async () => {
    if (!onDisconnect) return;
    
    setIsDisconnecting(true);
    try {
      await clearWalletState();
      onDisconnect();
    } catch (err) {
      console.error("Error disconnecting wallet:", err);
    } finally {
      setIsDisconnecting(false);
    }
  };

  // For header variant, show a more compact display with disconnect button instead of badge
  if (variant === "header") {
    return (
      <div className="flex items-center gap-1.5">
        <div className="flex items-center gap-1.5 bg-purple-900/30 px-2.5 py-1 rounded-full border border-purple-700/50">
          {showIcon && <Wallet className="h-3.5 w-3.5 text-purple-400" />}
          <span className="text-xs font-medium text-purple-300">{getDisplayAddress()}</span>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleDisconnect}
            disabled={isDisconnecting}
            className="h-5 w-5 p-0 ml-0.5 text-purple-300 hover:text-purple-100 hover:bg-purple-800/50"
            title="Disconnect wallet"
          >
            <LogOut className="h-3 w-3" />
          </Button>
        </div>
      </div>
    );
  }

  // Default display
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        {showIcon && <Wallet className="h-4 w-4 text-purple-400" />}
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-medium text-sm">{getDisplayAddress()}</span>
            <Badge variant="outline" className="h-5 text-xs bg-purple-900/30 text-purple-300 border-purple-700/50">
              {getWalletDisplayName(walletType)}
            </Badge>
          </div>
        </div>
      </div>
      
      {onDisconnect && (
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleDisconnect}
          disabled={isDisconnecting}
          className="h-8 text-xs"
        >
          <LogOut className="mr-1.5 h-3.5 w-3.5" />
          Disconnect
        </Button>
      )}
    </div>
  );
};
