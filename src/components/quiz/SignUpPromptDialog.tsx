
import { useState, useEffect } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { supabase } from '@/lib/supabase';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { WalletOptions } from '@/components/wallet/WalletOptions';

interface SignUpPromptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnect?: (connected: boolean, address?: string | null, type?: string | null) => void;
}

export const SignUpPromptDialog = ({ open, onOpenChange, onConnect }: SignUpPromptDialogProps) => {
  const { walletAddress, isConnected } = useWallet();
  
  useEffect(() => {
    const initializeWalletState = async () => {
      try {
        // Instead of using walletService.ensureWalletProfile, use direct database call
        if (isConnected && walletAddress) {
          console.log("Ensuring wallet profile for:", walletAddress);
          try {
            // Ensure profile exists in database using upsert
            const { error } = await supabase
              .from('wallet_profiles')
              .upsert({ 
                wallet_address: walletAddress,
                username: `Wallet_${walletAddress.substring(0, 6)}`
              }, { onConflict: 'wallet_address' });
              
            if (error) {
              console.error("Error ensuring wallet profile:", error);
            }
          } catch (error) {
            console.error("Database error creating wallet profile:", error);
          }
        }
      } catch (error) {
        console.error("Error initializing wallet state:", error);
      }
    };
    
    initializeWalletState();
  }, [walletAddress, isConnected]);
  
  const handleWalletConnect = (connected: boolean, address: string | null, type?: string | null) => {
    if (onConnect) {
      onConnect(connected, address, type);
    }
    onOpenChange(false);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Connect Your Wallet</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <p className="text-sm text-muted-foreground">
            Connect your wallet to participate in the quiz and earn rewards.
          </p>
          <WalletOptions onConnect={handleWalletConnect}>
            Connect Wallet
          </WalletOptions>
        </div>
      </DialogContent>
    </Dialog>
  );
};
