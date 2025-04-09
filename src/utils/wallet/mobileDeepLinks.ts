
/**
 * Utility functions for handling mobile wallet deep links
 */
import { WalletType } from '@/services/wallet/walletService';
import { isIOSDevice, isAndroidDevice, isBrowserContext } from '@/utils/device/deviceDetection';
import { logDebug } from '@/utils/debugLogging';
import { toast } from 'sonner';

/**
 * Interface for deep link options
 */
interface DeepLinkOptions {
  fallbackURL?: string;
  callbackURL?: string;
  fallbackCallback?: () => void;
  onBeforeOpenLink?: () => void;
}

/**
 * Open a deep link to a mobile wallet app - Ethereum wallets only
 */
export const openWalletDeepLink = (
  walletType: WalletType,
  uri: string,
  options: DeepLinkOptions = {}
): boolean => {
  if (typeof window === 'undefined') return false;
  
  const { 
    fallbackURL, 
    callbackURL, 
    fallbackCallback, 
    onBeforeOpenLink 
  } = options;
  
  // Call the before open handler if provided
  if (onBeforeOpenLink) {
    onBeforeOpenLink();
  }
  
  let deepLink: string | null = null;
  
  // Only handle Ethereum-related wallets
  switch (walletType) {
    case 'metamask':
      if (isIOSDevice() || isAndroidDevice()) {
        // MetaMask deep link format
        deepLink = `metamask://`;
      }
      break;
      
    default:
      logDebug('WALLET', `No deep link available for wallet type: ${walletType}`);
      break;
  }
  
  // If no deep link is available, try the fallback
  if (!deepLink) {
    if (fallbackURL) {
      window.open(fallbackURL, '_blank');
      return true;
    } else if (fallbackCallback) {
      fallbackCallback();
      return true;
    }
    return false;
  }
  
  logDebug('WALLET', `Opening deep link: ${deepLink}`);
  
  try {
    // Open the deep link
    window.location.href = deepLink;
    return true;
  } catch (error) {
    logDebug('WALLET', `Error opening deep link: ${error}`);
    
    // Try fallback if available
    if (fallbackURL) {
      window.open(fallbackURL, '_blank');
      return true;
    } else if (fallbackCallback) {
      fallbackCallback();
      return true;
    }
    
    return false;
  }
};

/**
 * Get the app store URL for a wallet - Ethereum wallets only
 */
export const getWalletAppStoreURL = (walletType: WalletType): string => {
  const isIOS = isIOSDevice();
  
  // Only handle Ethereum wallets
  switch (walletType) {
    case 'metamask':
      return isIOS
        ? 'https://apps.apple.com/app/metamask-blockchain-wallet/id1438144202'
        : 'https://play.google.com/store/apps/details?id=io.metamask';
      
    default:
      return '';
  }
};

/**
 * Redirect user to download a wallet from the app store
 */
export const redirectToWalletAppStore = (walletType: WalletType): boolean => {
  const appStoreURL = getWalletAppStoreURL(walletType);
  
  if (!appStoreURL) {
    toast.error(`No app store link available for ${walletType}`);
    return false;
  }
  
  try {
    window.open(appStoreURL, '_blank');
    return true;
  } catch (error) {
    console.error('Error opening app store:', error);
    return false;
  }
};

/**
 * Check if deep linking is supported for a wallet - Ethereum wallets only
 */
export const isDeepLinkSupported = (walletType: WalletType): boolean => {
  // Deep linking is generally only supported on mobile devices
  if (!isIOSDevice() && !isAndroidDevice()) {
    return false;
  }
  
  // Only enable deep linking in browser contexts
  if (!isBrowserContext()) {
    return false;
  }
  
  // Only support Ethereum wallets
  switch (walletType) {
    case 'metamask':
      return true;
    default:
      return false;
  }
};
