import { useState, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Check } from 'lucide-react';
import { WalletType } from '@/services/wallet/walletService';
import { useReownWallet } from '@/hooks/useReownWallet';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { logDebug } from '@/utils/debugLogging';

interface ReownWalletOptionsProps {
  onConnect: (connected: boolean, address: string | null, walletType?: WalletType | null) => void;
  onClose?: () => void;
  defaultTab?: string;
  showIntroText?: boolean;
  network?: 'mainnet' | 'testnet';
  className?: string;
  forcePrompt?: boolean;
}

export function ReownWalletOptions({
  onConnect,
  onClose,
  defaultTab = 'solana',
  showIntroText = true,
  network = 'mainnet',
  className = '',
  forcePrompt = true
}: ReownWalletOptionsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [detectedWallets, setDetectedWallets] = useState<WalletType[]>([]);
  const { isConnecting, error, connectWallet } = useReownWallet();

  // Detect available wallets
  useEffect(() => {
    const detectWallets = async () => {
      try {
        // Check for Ethereum wallets
        const hasEthereum = !!(window as any).ethereum;
        const hasMetaMask = hasEthereum && (window as any).ethereum.isMetaMask;
        const hasPhantomEth = hasEthereum && (window as any).ethereum.isPhantom;
        
        // Check for Solana wallets
        const hasSolana = !!(window as any).solana;
        const hasPhantom = hasSolana || !!(window as any).phantom?.solana;
        const hasSolflare = !!(window as any).solflare;
        
        const detected: WalletType[] = [];
        if (hasMetaMask) detected.push('metamask');
        if (hasPhantomEth) detected.push('phantom_ethereum');
        if (hasPhantom) detected.push('phantom');
        if (hasSolflare) detected.push('solflare');
        
        setDetectedWallets(detected);
        logDebug('WALLET', `Detected wallets: ${detected.join(', ')}`);
      } catch (err) {
        console.error('Error detecting wallets:', err);
      }
    };
    
    detectWallets();
  }, []);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  const handleConnectWallet = async (type: WalletType) => {
    try {
      // For Phantom wallet, set the appropriate type based on the active tab
      const actualType = type === 'phantom' 
        ? (activeTab === 'solana' ? 'phantom' : 'phantom_ethereum')
        : type;
      
      const result = await connectWallet(actualType);
      
      if (result.connected && result.address) {
        toast.success(`Connected to ${actualType} wallet`);
        onConnect(true, result.address, actualType);
      } else {
        toast.error(`Failed to connect to ${actualType}`);
        onConnect(false, null, null);
      }
    } catch (err: any) {
      console.error(`Error connecting to ${type}:`, err);
      toast.error(err.message || `Failed to connect to ${type}`);
      onConnect(false, null, null);
    }
  };

  const isDetected = (type: WalletType) => detectedWallets.includes(type);
  
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
            <Badge variant="success" className="ml-2 px-2 py-0 text-xs">
              {solanaWalletsCount}
            </Badge>
          )}
        </TabsTrigger>
        <TabsTrigger value="ethereum" className="flex items-center justify-center gap-2">
          <img 
            src="/lovable-uploads/d2bffb61-10ef-4529-bc2c-4f69c022ce5e.png" 
            alt="Ethereum" 
            className="h-4 w-4" 
          />
          <span>Ethereum</span>
          {activeTab === 'ethereum' && <Check className="h-3 w-3 text-purple-400 ml-1" />}
          {ethereumWalletsCount > 0 && (
            <Badge variant="success" className="ml-2 px-2 py-0 text-xs">
              {ethereumWalletsCount}
            </Badge>
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
                  <img alt="Phantom" className="h-5 w-5" src="/lovable-uploads/352936f5-6287-43a8-9d93-790d89b4a3fb.png" />
                </div>
                <span>Phantom (Solana)</span>
                
                {isDetected('phantom') && (
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
                  <img alt="Solflare" className="h-5 w-5" src="/lovable-uploads/solflare.png" />
                </div>
                <span>Solflare</span>
                
                {isDetected('solflare') && (
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
              onClick={() => handleConnectWallet('phantom')} 
              disabled={isConnecting !== null} 
              className="w-full flex items-center justify-between bg-gray-800 hover:bg-gray-700"
            >
              <div className="flex items-center">
                <div className="h-5 w-5 mr-2 flex items-center justify-center">
                  <img alt="Phantom" className="h-5 w-5" src="/lovable-uploads/352936f5-6287-43a8-9d93-790d89b4a3fb.png" />
                </div>
                <span>Phantom (Ethereum)</span>
                
                {isDetected('phantom_ethereum') && (
                  <Badge variant="success" className="ml-2 px-2 py-0 text-xs">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Detected
                  </Badge>
                )}
              </div>
              {isConnecting === 'phantom_ethereum' && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
            </Button>
            
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
                
                {isDetected('metamask') && (
                  <Badge variant="success" className="ml-2 px-2 py-0 text-xs">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Detected
                  </Badge>
                )}
              </div>
              {isConnecting === 'metamask' && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
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
