
import { toast } from 'sonner';
import { logDebug } from '@/utils/debugLogging';
import { walletStorageService } from '@/services/wallet/walletStorageService';
import { walletService } from '@/lib/services/walletService';
import { isMetamaskInstalled, connectMetamask, disconnectMetamask } from '@/utils/wallet/metamask';
import { withRetryBackoff } from '@/utils/wallet/retryUtils';
import { WalletConnectionResult } from '@/types/wallet-connection';

/**
 * Hook for MetaMask wallet connections
 */
export const useMetaMaskWallet = () => {
  const connectMetaMaskWallet = async (): Promise<WalletConnectionResult> => {
    try {
      if (!isMetamaskInstalled()) {
        toast.error('MetaMask is not installed');
        window.open('https://metamask.io/download/', '_blank');
        return { success: false, error: 'MetaMask is not installed' };
      }
      
      const address = await withRetryBackoff(
        () => connectMetamask(),
        3,
        'Metamask Connection'
      );
      
      if (address) {
        const currentWalletType = 'metamask';
        
        walletStorageService.storeConnection(address, currentWalletType);
        
        try {
          await walletService.logConnection(address, currentWalletType);
          await walletService.ensureWalletProfile(address, currentWalletType);
          logDebug('WALLET', `Connected to MetaMask with address: ${address}`);
        } catch (err) {
          console.warn("Non-critical error ensuring wallet profile:", err);
        }
        
        walletStorageService.dispatchWalletEvent('connected', address, currentWalletType);
        
        return { success: true, address, type: currentWalletType };
      }
      
      return { success: false, error: 'Failed to connect MetaMask wallet' };
    } catch (error: any) {
      console.error('Error connecting MetaMask wallet:', error);
      return { success: false, error: error?.message || 'Error connecting MetaMask wallet' };
    }
  };

  const disconnectMetaMaskWallet = async (): Promise<WalletConnectionResult> => {
    try {
      await disconnectMetamask();
      logDebug('WALLET', 'Disconnected from MetaMask wallet');
      return { success: true };
    } catch (error: any) {
      console.error('Error disconnecting MetaMask wallet:', error);
      return { success: false, error: error?.message || 'Error disconnecting MetaMask wallet' };
    }
  };

  return {
    connectMetaMaskWallet,
    disconnectMetaMaskWallet
  };
};
