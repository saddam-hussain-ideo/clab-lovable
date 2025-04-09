import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { WagmiWalletOptions } from "./WagmiWalletOptions";
import { WalletType } from "@/services/wallet/walletService";
import { isMobileDevice } from "@/utils/device/deviceDetection";
import { MobileWalletConnect } from "./MobileWalletConnect";
import { formatWalletAddress } from "@/utils/wallet/formatWalletAddress";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";

interface WagmiWalletModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnect?: (connected: boolean, address: string | null, walletType?: WalletType | null) => void;
  network?: 'mainnet' | 'testnet';
  forcePrompt?: boolean;
}

export const WagmiWalletModal = ({ 
  open, 
  onOpenChange, 
  onConnect, 
  network = 'mainnet',
  forcePrompt = true
}: WagmiWalletModalProps) => {
  const isMobile = isMobileDevice();
  const [showMobileView, setShowMobileView] = useState(isMobile);
  
  // Add debugging to see when the modal is triggered
  useEffect(() => {
    if (open) {
      console.log("[WagmiWalletModal] Modal opened with network:", network);
      console.log("[WagmiWalletModal] Force prompt:", forcePrompt);
      console.log("[WagmiWalletModal] Is mobile device:", isMobile);
    }
  }, [open, network, forcePrompt, isMobile]);

  const handleWalletConnection = (connected: boolean, address: string | null, type?: WalletType | null) => {
    try {
      // Only proceed if we have valid data
      if (connected && (!address || !type)) {
        console.warn("[WagmiWalletModal] Invalid connection data:", { connected, address, type });
        return;
      }

      // Only attempt to format the address if it's a string and we're connected
      const truncatedAddress = connected && typeof address === 'string' ? formatWalletAddress(address) : null;
      
      console.log("[WagmiWalletModal] Connection result:", { 
        connected, 
        address, 
        type,
        truncated: truncatedAddress
      });
      
      // Only store wallet data if connection was successful
      if (connected && address && typeof address === 'string') {
        try {
          localStorage.setItem('walletAddress', address);
          if (type) {
            localStorage.setItem('walletType', type);
          }
        } catch (storageError) {
          console.error('[WagmiWalletModal] Error storing wallet data:', storageError);
        }
      }
      
      // Handle the callback regardless of success/failure
      if (onConnect) {
        try {
          onConnect(connected, address, type);
        } catch (callbackError) {
          console.error('[WagmiWalletModal] Error in onConnect callback:', callbackError);
        }
      }
      
      // Close the modal only on successful connection
      if (connected && address) {
        console.log("[WagmiWalletModal] Closing modal after successful connection");
        onOpenChange(false);
      } else if (!connected) {
        // If connection failed, keep modal open but log it
        console.log("[WagmiWalletModal] Connection failed, keeping modal open");
      }
      
    } catch (error) {
      console.error('[WagmiWalletModal] Error in handleWalletConnection:', error);
      // Don't close modal on error, let user try again
    }
  };

  const toggleView = () => {
    setShowMobileView(!showMobileView);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] rounded-2xl border-purple-500/30 bg-background/95 backdrop-blur-md shadow-lg">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-xl font-bold bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
            Connect Wallet
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Choose a wallet to connect to the application
          </DialogDescription>
        </DialogHeader>
        
        <div className="my-2 h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />
        
        {showMobileView ? (
          <MobileWalletConnect 
            onConnect={handleWalletConnection}
            network={network}
            onClose={() => onOpenChange(false)}
          />
        ) : (
          <WagmiWalletOptions 
            className="mt-2" 
            onConnect={handleWalletConnection}
            network={network}
            forcePrompt={forcePrompt}
          />
        )}
        
        <div className="mt-4 text-center text-xs text-muted-foreground">
          <p className="mb-2">
            Not seeing your preferred wallet options? 
            <Button 
              variant="link" 
              className="text-xs px-1 text-purple-400 hover:text-purple-300" 
              onClick={toggleView}
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Switch to {showMobileView ? 'browser' : 'mobile'} options
            </Button>
          </p>
          <p>By connecting your wallet, you agree to our <span className="text-purple-400 hover:text-purple-300 cursor-pointer">Terms of Service</span></p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
