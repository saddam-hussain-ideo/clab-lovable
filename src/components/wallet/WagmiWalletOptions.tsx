import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Check } from 'lucide-react';
import { WalletType } from '@/services/wallet/walletService';
import { useWalletConnect } from '@/hooks/useWalletConnect';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface WagmiWalletOptionsProps {
  onConnect: (connected: boolean, address: string | null, walletType?: WalletType | null) => void;
  onClose?: () => void;
  defaultTab?: string;
  showIntroText?: boolean;
  network?: 'mainnet' | 'testnet';
  className?: string;
  forcePrompt?: boolean;
}

export function WagmiWalletOptions({
  onConnect,
  onClose,
  defaultTab = 'solana',
  showIntroText = true,
  network = 'mainnet',
  className = '',
  forcePrompt = true
}: WagmiWalletOptionsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const { 
    connectWallet, 
    isConnecting, 
    error, 
    isWalletDetected,
    detectedWallets
  } = useWalletConnect();

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  const handleConnectWallet = async (type: WalletType) => {
    const result = await connectWallet(type);
    
    if (result.connected && result.address) {
      onConnect(true, result.address as string, type);
    } else {
      onConnect(false, null, null);
    }
  };
  
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
        <Card>
          {showIntroText && (
            <CardHeader>
              <CardTitle>Connect Solana Wallet</CardTitle>
              <CardDescription>
                Connect your Solana wallet to access all features and manage your tokens.
              </CardDescription>
            </CardHeader>
          )}
          
          <CardContent className="flex flex-col gap-4">
            <Button 
              variant="outline" 
              onClick={() => handleConnectWallet('phantom')} 
              disabled={isConnecting !== null} 
              className="w-full flex items-center justify-between bg-gray-800 hover:bg-gray-700"
            >
              <div className="flex items-center">
                <div className="h-5 w-5 mr-2 flex items-center justify-center">
                  <img 
                    alt="Phantom" 
                    className="h-5 w-5" 
                    src={`https://cdn.stamp.fyi/space/${encodeURIComponent('a797aa35c0fadbfc1a53e7f675162ed5226968b44a19ee3d24385c64d1d3c393')}`} 
                  />
                </div>
                <span>Phantom</span>
                
                {isWalletDetected('phantom') && (
                  <Badge variant="success" className="ml-2 px-2 py-0 text-xs">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Detected
                  </Badge>
                )}
              </div>
              {isConnecting === 'phantom' && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => handleConnectWallet('solflare')} 
              disabled={isConnecting !== null} 
              className="w-full flex items-center justify-between bg-gray-800 hover:bg-gray-700"
            >
              <div className="flex items-center">
                <div className="h-5 w-5 mr-2 flex items-center justify-center">
                  <img alt="Solflare" className="h-5 w-5" src="/lovable-uploads/e8637576-de29-474e-aa98-1b520d678210.png" />
                </div>
                <span>Solflare</span>
                
                {isWalletDetected('solflare') && (
                  <Badge variant="success" className="ml-2 px-2 py-0 text-xs">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Detected
                  </Badge>
                )}
              </div>
              {isConnecting === 'solflare' && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
            </Button>
            
            {error && (
              <div className="text-red-500 text-xs mt-2 p-2 bg-red-100/10 rounded-md">
                {error}
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="ethereum" className="mt-4">
        <Card>
          {showIntroText && (
            <CardHeader>
              <CardTitle>Connect Ethereum Wallet</CardTitle>
              <CardDescription>
                Connect your Ethereum wallet to access all features and manage your tokens.
              </CardDescription>
            </CardHeader>
          )}
          
          <CardContent className="flex flex-col gap-4">
            <Button 
              variant="outline" 
              onClick={() => handleConnectWallet('metamask')} 
              disabled={isConnecting !== null} 
              className="w-full flex items-center justify-between bg-gray-800 hover:bg-gray-700"
            >
              <div className="flex items-center">
                <div className="h-5 w-5 mr-2 flex items-center justify-center">
                  <img alt="MetaMask" className="h-5 w-5" src="/lovable-uploads/d2bffb61-10ef-4529-bc2c-4f69c022ce5e.png" />
                </div>
                <span>MetaMask</span>
                
                {isWalletDetected('metamask') && (
                  <Badge variant="success" className="ml-2 px-2 py-0 text-xs">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Detected
                  </Badge>
                )}
              </div>
              {isConnecting === 'metamask' && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => handleConnectWallet('phantom_ethereum')} 
              disabled={isConnecting !== null} 
              className="w-full flex items-center justify-between bg-gray-800 hover:bg-gray-700"
            >
              <div className="flex items-center">
                <div className="h-5 w-5 mr-2 flex items-center justify-center">
                  <img alt="Phantom" className="h-5 w-5" src="/lovable-uploads/352936f5-6287-43a8-9d93-790d89b4a3fb.png" />
                </div>
                <span>Phantom (Ethereum)</span>
                
                {isWalletDetected('phantom_ethereum') && (
                  <Badge variant="success" className="ml-2 px-2 py-0 text-xs">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Detected
                  </Badge>
                )}
              </div>
              {isConnecting === 'phantom_ethereum' && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
            </Button>
            
            {error && (
              <div className="text-red-500 text-xs mt-2 p-2 bg-red-100/10 rounded-md">
                {error}
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
