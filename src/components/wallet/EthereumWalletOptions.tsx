
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle } from 'lucide-react';
import { WalletType } from '@/services/wallet/walletService';
import { Badge } from '@/components/ui/badge';
import { isWalletInstalled } from '@/utils/wallet/walletDetection';
import { logDebug } from '@/utils/debugLogging';

interface EthereumWalletOptionsProps {
  isConnecting: WalletType | null;
  error: string | null;
  onConnectWallet: (type: WalletType) => Promise<void>;
  showIntroText?: boolean;
}

export function EthereumWalletOptions({
  isConnecting,
  error,
  onConnectWallet,
  showIntroText = true
}: EthereumWalletOptionsProps) {
  const [detectedWallets, setDetectedWallets] = useState<WalletType[]>([]);
  
  useEffect(() => {
    // Check which wallets are detected
    const isMetaMaskDetected = isWalletInstalled('metamask');
    const isPhantomEthDetected = isWalletInstalled('phantom_ethereum');
    
    const detected: WalletType[] = [];
    if (isMetaMaskDetected) detected.push('metamask');
    if (isPhantomEthDetected) detected.push('phantom_ethereum');
    
    setDetectedWallets(detected);
    logDebug('WALLET', `Detected Ethereum wallets: ${detected.join(', ')}`);
  }, []);
  
  const isDetected = (type: WalletType) => detectedWallets.includes(type);
  
  return (
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
          onClick={() => onConnectWallet('metamask')} 
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
        
        <Button 
          variant="outline" 
          onClick={() => onConnectWallet('phantom_ethereum')} 
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
          onClick={() => onConnectWallet('walletconnect')} 
          disabled={isConnecting !== null} 
          className="w-full flex items-center justify-between bg-gray-800 hover:bg-gray-700"
        >
          <div className="flex items-center">
            <div className="h-5 w-5 mr-2 flex items-center justify-center">
              <img alt="WalletConnect" className="h-5 w-5" src="/lovable-uploads/d9c9632f-b497-4efa-bdd3-f92baeb243e7.png" />
            </div>
            <span>WalletConnect</span>
          </div>
          {isConnecting === 'walletconnect' && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
        </Button>
        
        {error && (
          <div className="text-red-500 text-xs mt-2 p-2 bg-red-100/10 rounded-md">
            {error}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
