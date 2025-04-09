import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Wallet, LogOut, Loader2 } from 'lucide-react';
import { useWalletConnect } from '@/hooks/useWalletConnect';
import { formatWalletAddress } from '@/utils/wallet/formatWalletAddress';
import { WalletModal } from './WalletModal';
import { WalletType } from '@/services/wallet/walletService';
import { toast } from 'sonner';

interface WagmiWalletButtonProps {
  className?: string;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export function WagmiWalletButton({ 
  className = '', 
  variant = 'default',
  size = 'default'
}: WagmiWalletButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { address, isConnected, disconnectWallet } = useWalletConnect();
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  // Format the address for display
  const displayAddress = address ? formatWalletAddress(address as string) : '';

  const handleConnect = () => {
    setIsModalOpen(true);
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

  const handleWalletConnection = (connected: boolean, walletAddress: string | null, walletType: WalletType | null) => {
    if (connected && walletAddress) {
      toast.success(`Connected to ${walletType} wallet`);
      setIsModalOpen(false);
    }
  };

  return (
    <>
      {isConnected && address ? (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size={size}
            className={`flex items-center gap-2 ${className}`}
          >
            <Wallet className="h-4 w-4" />
            <span>{displayAddress}</span>
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
          className={`flex items-center gap-2 ${className}`}
        >
          <Wallet className="h-4 w-4" />
          <span>Connect Wallet</span>
        </Button>
      )}

      <WalletModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onConnect={handleWalletConnection}
        network="mainnet"
      />
    </>
  );
}
