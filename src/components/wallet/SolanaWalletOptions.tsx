import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle } from 'lucide-react';
import { WalletType } from '@/services/wallet/walletService';
import { logDebug } from '@/utils/debugLogging';
import { SolflareConnectButton } from './SolflareConnectButton';
import { Badge } from '@/components/ui/badge';
import { isWalletInstalled } from '@/utils/wallet/walletDetection';
import { isMobileDevice } from '@/utils/device/deviceDetection';
import { connectToPhantom } from '@/utils/wallet/walletConnectionHelper';
import { toast } from 'sonner';

interface SolanaWalletOptionsProps {
  isConnecting: WalletType | null;
  error: string | null;
  onConnectWallet: (type: WalletType | null) => Promise<void>;
  onSolflareConnect: (connected: boolean, address: string | null) => void;
  showIntroText?: boolean;
}

export function SolanaWalletOptions({
  isConnecting,
  error,
  onConnectWallet,
  onSolflareConnect,
  showIntroText = true
}: SolanaWalletOptionsProps) {
  const [detectedWallets, setDetectedWallets] = useState<WalletType[]>([]);
  const isMobile = isMobileDevice();
  
  useEffect(() => {
    // Check which wallets are detected
    const isPhantomDetected = isWalletInstalled('phantom');
    const isSolflareDetected = isWalletInstalled('solflare');
    
    const detected: WalletType[] = [];
    if (isPhantomDetected) detected.push('phantom');
    if (isSolflareDetected) detected.push('solflare');
    
    setDetectedWallets(detected);
    logDebug('WALLET', `Detected Solana wallets: ${detected.join(', ')}`);
  }, []);
  
  const isDetected = (type: WalletType) => detectedWallets.includes(type);

  const handlePhantomConnect = async () => {
    try {
      // Ensure we're not already connecting
      if (isConnecting) {
        console.log('[SolanaWalletOptions] Already connecting to wallet, ignoring request');
        return;
      }

      // Signal connection start to parent - this sets isConnecting state
      onConnectWallet('phantom');
      
      logDebug('WALLET', 'Initiating Phantom connection...');
      
      // Use our connection helper
      const result = await connectToPhantom();
      
      if (result.success && result.address) {
        logDebug('WALLET', `Phantom connected successfully: ${result.address}`);
        toast.success('Connected to Phantom wallet');
        // Success is already handled by the wallet connection helper
        // No need to call onConnectWallet again on success
      } else {
        logDebug('WALLET', `Phantom connection failed: ${result.error}`);
        // Report the error with toast like Solflare does
        toast.error(result.error || 'Failed to connect to Phantom');
        
        // Signal connection failure to reset the state
        onConnectWallet(null);
      }
    } catch (error: any) {
      console.error('Error in handlePhantomConnect:', error);
      toast.error(error.message || 'Failed to connect to Phantom');
      
      // Signal connection failure to reset the state
      onConnectWallet(null);
    }
  };

  return (
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
          onClick={handlePhantomConnect} 
          disabled={isConnecting !== null} 
          className="w-full flex items-center justify-between bg-gray-800 hover:bg-gray-700"
        >
          <div className="flex items-center">
            <div className="h-5 w-5 mr-2 flex items-center justify-center">
              <img alt="Phantom" className="h-5 w-5" src="/lovable-uploads/352936f5-6287-43a8-9d93-790d89b4a3fb.png" />
            </div>
            <span>Phantom</span>
            
            {isDetected('phantom') && (
              <Badge variant="success" className="ml-2 px-2 py-0 text-xs">
                <CheckCircle className="h-3 w-3 mr-1" />
                Detected
              </Badge>
            )}
          </div>
          {isConnecting === 'phantom' && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
        </Button>
        
        <SolflareConnectButton 
          onConnect={onSolflareConnect} 
          variant="outline"
          className="w-full justify-between text-slate-50 bg-gray-800 hover:bg-gray-700"
          isDetected={isDetected('solflare')}
        />
        
        {isMobile && (
          <div className="text-amber-300 text-xs mt-1 p-2 bg-amber-500/10 rounded-md">
            Note: For the best mobile experience, please install and use the wallet's native app.
          </div>
        )}
        
        {error && (
          <div className="text-red-500 text-xs mt-2 p-2 bg-red-100/10 rounded-md">
            {error}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
