import { useState, useEffect } from 'react';
import { Button, ButtonProps } from '@/components/ui/button';
import { Loader2, CheckCircle, Smartphone, AlertCircle } from 'lucide-react';
import { logDebug } from '@/utils/debugLogging';
import { Badge } from '@/components/ui/badge';
import { isMobileDevice } from '@/utils/device/deviceDetection';
import { openWalletDeepLink, redirectToWalletAppStore } from '@/utils/wallet/mobileDeepLinks';
import { toast } from 'sonner';
import { connectToSolflare } from '@/utils/wallet/walletConnectionHelper';

interface SolflareConnectButtonProps extends ButtonProps {
  onConnect: (connected: boolean, address: string | null) => void;
  isDetected?: boolean;
  showMobileOption?: boolean;
}

export function SolflareConnectButton({ 
  onConnect, 
  className = "",
  isDetected = false,
  showMobileOption = true,
  ...props
}: SolflareConnectButtonProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const [hasError, setHasError] = useState(false);
  const isMobile = isMobileDevice();
  
  // Check if already connected when component mounts
  useEffect(() => {
    if (window.solflare?.isConnected && window.solflare?.publicKey) {
      try {
        const address = window.solflare.publicKey.toString();
        if (address) {
          logDebug('SOLFLARE_BUTTON', `Already connected to Solflare: ${address}`);
          onConnect(true, address);
        }
      } catch (err) {
        console.error("Error checking existing Solflare connection:", err);
      }
    }
  }, [onConnect]);
  
  const handleConnectSolflare = async () => {
    if (isConnecting) return;
    
    setIsConnecting(true);
    setHasError(false);
    setConnectionAttempts(prev => prev + 1);
    
    try {
      if (!window.solflare) {
        // Handle mobile devices differently
        if (isMobile && showMobileOption) {
          toast.info('Opening Solflare mobile app...');
          
          const dummyUri = 'solana:connect/example?network=testnet';
          const callbackUrl = typeof window !== 'undefined' 
            ? `${window.location.origin}${window.location.pathname}?wallet=solflare` 
            : '';
          
          openWalletDeepLink('solflare', dummyUri, {
            callbackURL: callbackUrl,
            fallbackCallback: () => {
              // If deep link fails, offer app store
              toast.info('Opening app store to download Solflare');
              redirectToWalletAppStore('solflare');
            }
          });
          
          // Set a timeout to reset connecting state
          setTimeout(() => {
            setIsConnecting(false);
          }, 3000);
          
          return;
        }
        
        // For desktop, open download page
        toast.error('Solflare wallet extension not detected', {
          description: 'Please install the Solflare extension to continue',
          action: {
            label: 'Download',
            onClick: () => window.open('https://solflare.com/download', '_blank')
          }
        });
        
        setHasError(true);
        setIsConnecting(false);
        return;
      }
      
      logDebug('WALLET', 'Connecting to Solflare wallet');
      
      // Use our new connection helper
      const result = await connectToSolflare();
      
      if (result.success && result.address) {
        logDebug('WALLET', `Connected to Solflare: ${result.address}`);
        toast.success('Connected to Solflare wallet');
        onConnect(true, result.address);
      } else {
        logDebug('WALLET', `Failed to connect to Solflare: ${result.error}`);
        toast.error(result.error || 'Failed to connect to Solflare');
        onConnect(false, null);
        setHasError(true);
      }
    } catch (error: any) {
      console.error('Error connecting to Solflare:', error);
      toast.error(error.message || 'Failed to connect to Solflare');
      onConnect(false, null);
      setHasError(true);
    } finally {
      setIsConnecting(false);
    }
  };
  
  return (
    <Button 
      onClick={handleConnectSolflare} 
      disabled={isConnecting} 
      className={`flex items-center justify-between ${className} ${hasError ? 'border-red-400' : ''}`}
      {...props}
    >
      <div className="flex items-center">
        <div className="h-5 w-5 mr-2 flex items-center justify-center">
          <img alt="Solflare" className="h-5 w-5" src="/lovable-uploads/e8637576-de29-474e-aa98-1b520d678210.png" />
        </div>
        <span>Solflare</span>
        
        {isDetected && (
          <Badge variant="success" className="ml-2 px-2 py-0 text-xs">
            <CheckCircle className="h-3 w-3 mr-1" />
            Detected
          </Badge>
        )}
        
        {hasError && (
          <Badge variant="destructive" className="ml-2 px-2 py-0 text-xs">
            <AlertCircle className="h-3 w-3 mr-1" />
            Error
          </Badge>
        )}
        
        {isMobile && showMobileOption && (
          <Badge variant="outline" className="ml-2 px-2 py-0 text-xs border-purple-400 text-purple-400">
            <Smartphone className="h-3 w-3 mr-1" />
            Mobile
          </Badge>
        )}
      </div>
      {isConnecting && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
    </Button>
  );
}
