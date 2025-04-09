
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import { WalletType } from '@/services/wallet/walletService';
import { useWallet } from '@/hooks/useWallet';

interface DialogMetamaskProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnect?: (connected: boolean, address?: string | null, type?: WalletType | null) => void;
}

export const DialogMetamask = ({ open, onOpenChange, onConnect }: DialogMetamaskProps) => {
  const { connectWallet } = useWallet();
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConnectMetamask = async () => {
    setConnecting(true);
    setError(null);
    
    try {
      const result = await connectWallet('metamask');
      
      if (result.success) {
        console.log("Metamask connected successfully:", result.address);
        
        if (onConnect) {
          onConnect(true, result.address, 'metamask');
        }
        
        onOpenChange(false);
      } else {
        console.error("Failed to connect Metamask:", result.error);
        setError(result.error || "Failed to connect to MetaMask");
      }
    } catch (err: any) {
      console.error("Error connecting to Metamask:", err);
      setError(err?.message || "Unknown error connecting to MetaMask");
    } finally {
      setConnecting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Connect MetaMask</DialogTitle>
          <DialogDescription>
            Connect your MetaMask wallet to access Ethereum features.
          </DialogDescription>
        </DialogHeader>
        
        <div className="mt-4 flex flex-col items-center">
          <img 
            src="/lovable-uploads/d2bffb61-10ef-4529-bc2c-4f69c022ce5e.png" 
            alt="MetaMask Logo" 
            className="h-20 w-20 mb-4"
          />
          
          <Button 
            onClick={handleConnectMetamask}
            disabled={connecting}
            className="w-full mt-2"
          >
            {connecting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Connecting...
              </>
            ) : (
              "Connect MetaMask"
            )}
          </Button>
          
          {error && (
            <p className="mt-4 text-sm text-red-500">{error}</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
