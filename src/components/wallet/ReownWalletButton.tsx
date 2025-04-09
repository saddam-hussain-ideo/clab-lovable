import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Wallet, LogOut, Loader2 } from 'lucide-react';
import { useReownWallet } from '@/hooks/useReownWallet';
import { formatWalletAddress } from '@/utils/wallet/formatWalletAddress';
import { toast } from 'sonner';

interface ReownWalletButtonProps {
  className?: string;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export function ReownWalletButton({ 
  className = '', 
  variant = 'default',
  size = 'default'
}: ReownWalletButtonProps) {
  const { connectedWallet, connectWallet, disconnectWallet } = useReownWallet();
  const { address, type } = connectedWallet;
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  // Format the address for display
  const displayAddress = address ? formatWalletAddress(address) : '';

  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      const result = await connectWallet();
      if (result.connected && result.address) {
        toast.success('Connected to wallet');
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
      toast.error('Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      setIsDisconnecting(true);
      await disconnectWallet();
      toast.success('Wallet disconnected');
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
      toast.error('Failed to disconnect wallet');
    } finally {
      setIsDisconnecting(false);
    }
  };

  return (
    <>
      {address ? (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size={size}
            className={`flex items-center gap-2 ${className}`}
          >
            <Wallet className="h-4 w-4" />
            <span>{displayAddress}</span>
            {type && (
              <img 
                src={getWalletIcon(type)}
                alt={type}
                className="h-4 w-4 ml-1"
              />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDisconnect}
            disabled={isDisconnecting}
            className="text-red-500 hover:text-red-600 hover:bg-red-100/10"
          >
            {isDisconnecting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <LogOut className="h-4 w-4" />
            )}
          </Button>
        </div>
      ) : (
        <Button
          variant={variant}
          size={size}
          onClick={handleConnect}
          disabled={isConnecting}
          className={`flex items-center gap-2 ${className}`}
        >
          {isConnecting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Wallet className="h-4 w-4" />
          )}
          <span>Connect Wallet</span>
        </Button>
      )}
    </>
  );
}

// Helper function to get wallet icon
function getWalletIcon(type: string): string {
  switch (type) {
    case 'phantom':
    case 'phantom_ethereum':
      return '/lovable-uploads/352936f5-6287-43a8-9d93-790d89b4a3fb.png';
    case 'solflare':
      return '/lovable-uploads/e8637576-de29-474e-aa98-1b520d678210.png';
    case 'metamask':
      return '/lovable-uploads/d2bffb61-10ef-4529-bc2c-4f69c022ce5e.png';
    case 'walletconnect':
      return '/lovable-uploads/d9c9632f-b497-4efa-bdd3-f92baeb243e7.png';
    default:
      return '/lovable-uploads/d9c9632f-b497-4efa-bdd3-f92baeb243e7.png';
  }
}
