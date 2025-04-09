
import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Smartphone, QrCode, ExternalLink } from 'lucide-react';
import { WalletType } from '@/services/wallet/walletService';
import { openWalletDeepLink, redirectToWalletAppStore, isDeepLinkSupported } from '@/utils/wallet/mobileDeepLinks';
import { isIOSDevice, isAndroidDevice } from '@/utils/device/deviceDetection';
import { logDebug } from '@/utils/debugLogging';
import { Badge } from '@/components/ui/badge';

interface QRCodeWalletConnectProps {
  uri: string;
  walletType: WalletType;
  onClose?: () => void;
  onConnect?: () => void;
  callbackUrl?: string;
}

export const QRCodeWalletConnect: React.FC<QRCodeWalletConnectProps> = ({
  uri,
  walletType,
  onClose,
  onConnect,
  callbackUrl
}) => {
  const [copied, setCopied] = useState(false);
  const isIOS = isIOSDevice();
  const isAndroid = isAndroidDevice();
  
  // Format wallet name for display
  const getWalletDisplayName = () => {
    switch (walletType) {
      case 'phantom':
        return 'Phantom';
      case 'solflare':
        return 'Solflare';
      case 'metamask':
        return 'MetaMask';
      default:
        return walletType.charAt(0).toUpperCase() + walletType.slice(1);
    }
  };
  
  // Get wallet app icon
  const getWalletIcon = () => {
    switch (walletType) {
      case 'phantom':
        return '/lovable-uploads/352936f5-6287-43a8-9d93-790d89b4a3fb.png';
      case 'solflare':
        return '/lovable-uploads/e8637576-de29-474e-aa98-1b520d678210.png';
      case 'metamask':
        return '/lovable-uploads/d2bffb61-10ef-4529-bc2c-4f69c022ce5e.png';
      default:
        return '';
    }
  };
  
  // Copy URI to clipboard
  const copyToClipboard = () => {
    navigator.clipboard.writeText(uri).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      },
      (err) => {
        console.error('Failed to copy: ', err);
      }
    );
  };
  
  // Open wallet app via deep link
  const openWalletApp = () => {
    logDebug('WALLET', `Opening ${walletType} app with URI: ${uri}`);
    
    openWalletDeepLink(walletType, uri, {
      callbackURL: callbackUrl,
      fallbackCallback: () => {
        // If deep link fails, show app store
        redirectToWalletAppStore(walletType);
      },
      onBeforeOpenLink: () => {
        if (onConnect) {
          onConnect();
        }
      }
    });
  };
  
  // Determine if deep linking is available
  const canOpenWalletApp = isDeepLinkSupported(walletType);
  
  return (
    <Card className="w-full max-w-sm mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {getWalletIcon() && (
              <img 
                src={getWalletIcon()} 
                alt={getWalletDisplayName()} 
                className="w-6 h-6" 
              />
            )}
            <CardTitle>{getWalletDisplayName()} Mobile</CardTitle>
          </div>
          
          {(isIOS || isAndroid) && (
            <Badge variant="outline" className="text-xs px-2 py-0 border-purple-400 text-purple-400">
              {isIOS ? 'iOS' : 'Android'}
            </Badge>
          )}
        </div>
        <CardDescription>
          Scan this QR code with your {getWalletDisplayName()} mobile app to connect
        </CardDescription>
      </CardHeader>
      
      <CardContent className="flex flex-col items-center">
        <div className="bg-white p-3 rounded-lg mb-4">
          <QRCodeSVG 
            value={uri} 
            size={200} 
            bgColor="#FFFFFF"
            fgColor="#000000"
            level="L"
            includeMargin={false}
          />
        </div>
        
        <div className="w-full space-y-3">
          <Button 
            variant="outline" 
            className="w-full flex items-center justify-center"
            onClick={copyToClipboard}
          >
            <QrCode className="mr-2 h-4 w-4" />
            {copied ? 'Copied!' : 'Copy to Clipboard'}
          </Button>
          
          {canOpenWalletApp && (
            <Button 
              variant="default" 
              className="w-full bg-purple-600 hover:bg-purple-700 flex items-center justify-center"
              onClick={openWalletApp}
            >
              <Smartphone className="mr-2 h-4 w-4" />
              Open in {getWalletDisplayName()} App
            </Button>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="flex flex-col">
        <div className="w-full text-xs text-muted-foreground mt-2 text-center">
          Don't have the app?{' '}
          <Button 
            variant="link" 
            className="h-auto p-0 text-xs text-purple-400"
            onClick={() => redirectToWalletAppStore(walletType)}
          >
            Download {getWalletDisplayName()}
            <ExternalLink className="ml-1 h-3 w-3" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};
