import React, { useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { WalletType } from "@/services/wallet/walletService";
import { walletRegistry } from "@/services/wallet/walletRegistry";
import { isMobileDevice } from "@/utils/device/deviceDetection";
import { formatWalletAddress } from "@/utils/wallet/formatWalletAddress";
import { useAccount } from "wagmi";
import { Button } from "@/components/ui/button";
import { useAppKit } from "@reown/appkit/react";

interface WalletModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnect?: (connected: boolean, address: string | null, walletType?: WalletType | null) => void;
  network?: 'mainnet' | 'testnet';
  forcePrompt?: boolean;
}

export const WalletModal = ({ 
  open, 
  onOpenChange, 
  onConnect, 
  network = 'mainnet',
  forcePrompt = true
}: WalletModalProps) => {
  const isMobile = isMobileDevice();
  const { address, isConnected } = useAccount();
  const { open: openReownModal } = useAppKit();
  
  // Add debugging to see when the modal is triggered
  useEffect(() => {
    if (open) {
      console.log("[WalletModal] Modal opened with network:", network);
      console.log("[WalletModal] Force prompt:", forcePrompt);
      console.log("[WalletModal] Is mobile device:", isMobile);
      
      // Debug available wallets
      const availableWallets = walletRegistry.providers.map(p => ({
        id: p.id,
        name: p.name,
        available: p.isAvailable()
      }));
      console.log("[WalletModal] All registered wallets:", availableWallets);
      
      // Open the Reown modal automatically when our modal is opened
      openReownModal();
    }
  }, [open, network, forcePrompt, isMobile, openReownModal]);

  // Handle wallet connection changes
  useEffect(() => {
    if (isConnected && address) {
      handleWalletConnection(true, address, 'metamask');
    }
  }, [isConnected, address]);

  const handleWalletConnection = (connected: boolean, address: string | null, type?: WalletType | null) => {
    try {
      // Only proceed if we have valid data
      if (connected && (!address || !type)) {
        console.warn("[WalletModal] Invalid connection data:", { connected, address, type });
        return;
      }

      // Only attempt to format the address if it's a string and we're connected
      const truncatedAddress = connected && typeof address === 'string' ? formatWalletAddress(address) : null;
      
      console.log("[WalletModal] Connection result:", { 
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
          console.error('[WalletModal] Error storing wallet data:', storageError);
        }
      }
      
      // Handle the callback regardless of success/failure
      if (onConnect) {
        try {
          onConnect(connected, address, type);
        } catch (callbackError) {
          console.error('[WalletModal] Error in onConnect callback:', callbackError);
        }
      }
      
      // Close the modal only on successful connection
      if (connected && address) {
        console.log("[WalletModal] Closing modal after successful connection");
        onOpenChange(false);
      } else if (!connected) {
        // If connection failed, keep modal open but log it
        console.log("[WalletModal] Connection failed, keeping modal open");
      }
      
    } catch (error) {
      console.error('[WalletModal] Error in handleWalletConnection:', error);
      // Don't close modal on error, let user try again
    }
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
        
        <div className="flex flex-col gap-4 mt-4">
          <Button 
            onClick={() => openReownModal()}
            className="w-full bg-gradient-to-r from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800"
          >
            Open Wallet Options
          </Button>
        </div>
        
        <div className="mt-4 text-center text-xs text-muted-foreground">
          <p>By connecting your wallet, you agree to our <span className="text-purple-400 hover:text-purple-300 cursor-pointer">Terms of Service</span></p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
