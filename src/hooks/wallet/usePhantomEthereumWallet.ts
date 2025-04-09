
import { toast } from 'sonner';
import { logDebug } from '@/utils/debugLogging';
import { walletStorageService } from '@/services/wallet/walletStorageService';
import { walletService } from '@/lib/services/walletService';
import { 
  isPhantomEthereumAvailable, 
  connectPhantomEthereumWallet, 
  disconnectPhantomEthereum 
} from '@/utils/wallet/phantom';
import { WalletConnectionResult } from '@/types/wallet-connection';

/**
 * Hook for Phantom Ethereum wallet connections
 */
export const usePhantomEthereumWallet = () => {
  const connectPhantomEthWallet = async (): Promise<WalletConnectionResult> => {
    try {
      if (!isPhantomEthereumAvailable()) {
        toast.error('Phantom wallet with Ethereum support is not installed');
        window.open('https://phantom.app/download', '_blank');
        return { success: false, error: 'Phantom wallet with Ethereum support is not installed' };
      }
      
      try {
        const address = await connectPhantomEthereumWallet();
        
        if (address) {
          const currentWalletType = 'phantom_ethereum';
          
          walletStorageService.storeConnection(address, currentWalletType);
          
          try {
            await walletService.logConnection(address, currentWalletType);
            await walletService.ensureWalletProfile(address, currentWalletType);
            logDebug('WALLET', `Connected to Phantom Ethereum with address: ${address}`);
          } catch (err) {
            console.warn("Non-critical error ensuring wallet profile:", err);
          }
          
          walletStorageService.dispatchWalletEvent('connected', address, currentWalletType);
          
          return { success: true, address, type: currentWalletType };
        }
      } catch (error: any) {
        console.error('Error connecting Phantom Ethereum:', error);
        let errorMessage = 'Failed to connect Phantom Ethereum';
        
        if (error.code === 4001) {
          errorMessage = 'Connection rejected by user';
        } else if (error.message) {
          // Enhanced error handling for Phantom-specific errors
          if (error.message.includes('Unexpected error')) {
            errorMessage = 'Phantom wallet encountered an unexpected error. Please try refreshing the page or reconnecting.';
          } else {
            errorMessage = error.message;
          }
        }
        
        toast.error(errorMessage);
        return { success: false, error: errorMessage };
      }
      
      return { success: false, error: 'Failed to connect Phantom Ethereum wallet' };
    } catch (error: any) {
      console.error('Error connecting Phantom Ethereum wallet:', error);
      return { success: false, error: error?.message || 'Error connecting Phantom Ethereum wallet' };
    }
  };

  const disconnectPhantomEthWallet = async (): Promise<WalletConnectionResult> => {
    try {
      await disconnectPhantomEthereum();
      logDebug('WALLET', 'Disconnected from Phantom Ethereum wallet');
      return { success: true };
    } catch (error: any) {
      console.error('Error disconnecting Phantom Ethereum wallet:', error);
      return { success: false, error: error?.message || 'Error disconnecting Phantom Ethereum wallet' };
    }
  };

  return {
    connectPhantomEthWallet,
    disconnectPhantomEthWallet
  };
};
