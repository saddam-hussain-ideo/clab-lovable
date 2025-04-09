import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Check } from 'lucide-react';
import { WalletType } from '@/services/wallet/walletService';
import { SolanaWalletOptions } from './SolanaWalletOptions';
import { EthereumWalletOptions } from './EthereumWalletOptions';
import { useWalletConnectOptions, UseWalletConnectOptionsProps } from '@/hooks/useWalletConnectOptions';

export interface WalletConnectOptionsProps extends UseWalletConnectOptionsProps {
  defaultTab?: string;
  showIntroText?: boolean;
  network?: 'mainnet' | 'testnet';
  className?: string;
}

export function WalletConnectOptions({
  onConnect,
  onClose,
  defaultTab = 'solana',
  showIntroText = true,
  network = 'mainnet',
  className = '',
  forcePrompt = true
}: WalletConnectOptionsProps) {
  const {
    activeTab,
    isConnecting,
    error,
    isConnectingEth,
    detectedWallets,
    handleTabChange,
    handleConnectWallet,
    handleSolflareConnect
  } = useWalletConnectOptions({ onConnect, onClose, forcePrompt });
  
  // Count how many wallets are detected in each tab
  const solanaWalletsCount = detectedWallets.filter(
    w => w === 'phantom' || w === 'solflare'
  ).length;
  
  const ethereumWalletsCount = detectedWallets.filter(
    w => w === 'metamask' || w === 'phantom_ethereum'
  ).length;
  
  return (
    <Tabs 
      defaultValue={defaultTab} 
      className={`w-full ${className}`}
      onValueChange={handleTabChange}
      value={activeTab}
    >
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="solana" className="flex items-center justify-center gap-2">
          <img 
            src="/lovable-uploads/4e5b5f8b-196f-43dc-89f5-1a2e9701d523.png" 
            alt="Solana" 
            className="h-4 w-4" 
          />
          <span>Solana</span>
          {activeTab === 'solana' && <Check className="h-3 w-3 text-purple-400 ml-1" />}
          {solanaWalletsCount > 0 && (
            <span className="bg-green-500 text-white text-xs px-1 rounded-full ml-1">
              {solanaWalletsCount}
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger value="ethereum" className="flex items-center justify-center gap-2">
          <img 
            src="/lovable-uploads/a67f8f8c-8452-4984-8cef-c0395c8e8d63.png" 
            alt="Ethereum" 
            className="h-4 w-4" 
          />
          <span>Ethereum</span>
          {activeTab === 'ethereum' && <Check className="h-3 w-3 text-purple-400 ml-1" />}
          {ethereumWalletsCount > 0 && (
            <span className="bg-green-500 text-white text-xs px-1 rounded-full ml-1">
              {ethereumWalletsCount}
            </span>
          )}
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="solana" className="mt-4">
        <SolanaWalletOptions
          isConnecting={isConnecting}
          error={error}
          onConnectWallet={handleConnectWallet}
          onSolflareConnect={handleSolflareConnect}
          showIntroText={showIntroText}
        />
      </TabsContent>
      
      <TabsContent value="ethereum" className="mt-4">
        <EthereumWalletOptions
          isConnecting={isConnecting}
          error={error}
          onConnectWallet={handleConnectWallet}
          showIntroText={showIntroText}
        />
      </TabsContent>
    </Tabs>
  );
}
