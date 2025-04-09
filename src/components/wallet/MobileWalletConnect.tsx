import React, { useState } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Smartphone, Check, Wallet } from 'lucide-react';
import { WalletType } from '@/services/wallet/walletService';
import { isMobileDevice, isIOSDevice, isAndroidDevice } from '@/utils/device/deviceDetection';
import { logDebug } from '@/utils/debugLogging';
import { Badge } from '@/components/ui/badge';
import { useWalletConnect } from '@/hooks/useWalletConnect';

interface MobileWalletConnectProps {
  onConnect: (connected: boolean, address?: string | null, type?: WalletType | null) => void;
  network?: 'mainnet' | 'testnet';
  onClose?: () => void;
}

export function MobileWalletConnect({
  onConnect,
  network = 'mainnet',
  onClose
}: MobileWalletConnectProps) {
  const [activeTab, setActiveTab] = useState<'phantom' | 'solflare'>('phantom');
  
  // Use the wallet hook
  const { 
    connectWallet, 
    isConnecting, 
    isWalletDetected
  } = useWalletConnect();
  
  const isIOS = isIOSDevice();
  const isAndroid = isAndroidDevice();
  
  // Get wallet logo based on type
  const getWalletLogo = (type: WalletType): string => {
    switch (type) {
      case 'phantom':
        return '/lovable-uploads/352936f5-6287-43a8-9d93-790d89b4a3fb.png';
      case 'solflare':
        return '/lovable-uploads/e8637576-de29-474e-aa98-1b520d678210.png';
      case 'metamask':
        return '/lovable-uploads/d2bffb61-10ef-4529-bc2c-4f69c022ce5e.png';
      case 'phantom_ethereum':
        return '/lovable-uploads/352936f5-6287-43a8-9d93-790d89b4a3fb.png';
      default:
        return '';
    }
  };
  
  // Handle opening a wallet app
  const handleOpenWallet = async (type: WalletType) => {
    try {
      logDebug('WALLET', `Opening ${type} wallet app`);
      
      const result = await connectWallet(type);
      
      if (result.connected && result.address) {
        onConnect(true, result.address, type);
        if (onClose) onClose();
      }
    } catch (error) {
      console.error(`Error connecting to ${type}:`, error);
    }
  };
  
  // Handle downloading a wallet app
  const handleDownloadWallet = (type: WalletType) => {
    let storeUrl = '';
    
    if (isIOS) {
      // iOS App Store links
      switch (type) {
        case 'phantom':
          storeUrl = 'https://apps.apple.com/us/app/phantom-solana-wallet/id1598432977';
          break;
        case 'solflare':
          storeUrl = 'https://apps.apple.com/us/app/solflare/id1620658841';
          break;
        case 'metamask':
          storeUrl = 'https://apps.apple.com/us/app/metamask-blockchain-wallet/id1438144202';
          break;
        default:
          storeUrl = '';
      }
    } else if (isAndroid) {
      // Google Play Store links
      switch (type) {
        case 'phantom':
          storeUrl = 'https://play.google.com/store/apps/details?id=app.phantom';
          break;
        case 'solflare':
          storeUrl = 'https://play.google.com/store/apps/details?id=com.solflare.mobile';
          break;
        case 'metamask':
          storeUrl = 'https://play.google.com/store/apps/details?id=io.metamask';
          break;
        default:
          storeUrl = '';
      }
    }
    
    if (storeUrl) {
      window.open(storeUrl, '_blank');
    }
  };
  
  return (
    <Card className="border-0 shadow-none">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-medium">Connect Mobile Wallet</CardTitle>
        <CardDescription>
          Select a wallet to connect on your mobile device
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Tabs 
          defaultValue="phantom" 
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as 'phantom' | 'solflare')}
          className="w-full"
        >
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="phantom" className="flex items-center gap-2">
              <img src={getWalletLogo('phantom')} alt="Phantom" className="h-4 w-4" />
              <span>Phantom</span>
              {isWalletDetected('phantom') && (
                <Check className="h-3 w-3 text-green-500" />
              )}
            </TabsTrigger>
            <TabsTrigger value="solflare" className="flex items-center gap-2">
              <img src={getWalletLogo('solflare')} alt="Solflare" className="h-4 w-4" />
              <span>Solflare</span>
              {isWalletDetected('solflare') && (
                <Check className="h-3 w-3 text-green-500" />
              )}
            </TabsTrigger>
          </TabsList>
          
          <div className="space-y-4">
            {/* Tabs content - same for both tabs with customization */}
            <div className="flex flex-col gap-3">
              {isWalletDetected(activeTab) ? (
                <Button
                  variant="default"
                  className="w-full bg-purple-600 hover:bg-purple-700"
                  disabled={isConnecting !== null}
                  onClick={() => handleOpenWallet(activeTab)}
                >
                  {isConnecting === activeTab ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Wallet className="mr-2 h-4 w-4" />
                  )}
                  Open {activeTab === 'phantom' ? 'Phantom' : 'Solflare'} App
                </Button>
              ) : (
                <Button
                  variant="default"
                  className="w-full bg-purple-600 hover:bg-purple-700"
                  onClick={() => handleDownloadWallet(activeTab)}
                >
                  <Smartphone className="mr-2 h-4 w-4" />
                  Download {activeTab === 'phantom' ? 'Phantom' : 'Solflare'}
                </Button>
              )}
              
              {isIOS || isAndroid ? (
                <div className="text-xs text-center text-muted-foreground mt-2">
                  <p>
                    You're on {isIOS ? 'iOS' : 'Android'}. The button above will open the
                    wallet app if installed, or take you to download it.
                  </p>
                </div>
              ) : null}
            </div>
            
            <div className="mt-4 flex items-center justify-center">
              <Badge variant="outline" className="text-xs">
                {network === 'mainnet' ? 'Mainnet' : 'Testnet'}
              </Badge>
            </div>
          </div>
        </Tabs>
      </CardContent>
    </Card>
  );
}
