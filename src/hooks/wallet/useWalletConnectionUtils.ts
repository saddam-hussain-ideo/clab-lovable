
import { toast } from 'sonner';
import { logDebug } from '@/utils/debugLogging';
import { walletStorageService } from '@/services/wallet/walletStorageService';
import { walletService } from '@/lib/services/walletService';
import { withRetryBackoff } from '@/utils/wallet/retryUtils';
import { WalletConnectionResult } from '@/types/wallet-connection';

/**
 * Common utilities for wallet connections
 */
export const useWalletConnectionUtils = () => {
  /**
   * Check for stored wallet connection
   */
  const checkStoredWallet = () => {
    const storedWallet = walletStorageService.getConnection();
    if (storedWallet) {
      return storedWallet;
    }
    return null;
  };

  /**
   * Clear any existing wallet connections
   */
  const clearExistingConnections = async () => {
    logDebug('WALLET', 'Clearing any existing wallet connections before connecting a new one');
    
    try {
      if (window.phantom?.solana) {
        try {
          await window.phantom.solana.disconnect();
          logDebug('WALLET', 'Disconnected Phantom Solana');
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (e) {
          // Ignore errors during cleanup
        }
      }
      
      if (window.solflare) {
        try {
          await window.solflare.disconnect();
          logDebug('WALLET', 'Disconnected Solflare');
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (e) {
          // Ignore errors during cleanup
        }
      }
      
      walletStorageService.clearConnection();
    } catch (error) {
      console.warn('Error during connection cleanup:', error);
    }
  };

  /**
   * Restore wallet profile
   */
  const restoreWalletProfile = async (walletAddress: string, walletType: string = 'phantom'): Promise<boolean> => {
    try {
      console.log("Attempting to restore wallet profile for:", walletAddress, walletType);
      
      if (!localStorage.getItem('walletAddress')) {
        toast.error("Wallet is not connected. Please connect your wallet first.");
        return false;
      }
      
      const storedWalletType = localStorage.getItem('walletType');
      const effectiveWalletType = storedWalletType || walletType;
      
      const profile = await walletService.fetchWalletProfile(walletAddress, effectiveWalletType);
      
      if (!profile) {
        console.log("No profile found to restore for wallet:", walletAddress);
        return false;
      }
      
      console.log("Found wallet profile to restore:", profile);
      
      const syncedProfile = await walletService.syncWalletProfile(
        walletAddress, 
        profile, 
        true,
        effectiveWalletType
      );
      
      if (syncedProfile) {
        console.log("Successfully restored wallet profile:", syncedProfile);
        return true;
      } else {
        console.error("Failed to sync wallet profile during restoration");
        return false;
      }
    } catch (error) {
      console.error("Error restoring wallet profile:", error);
      return false;
    }
  };

  return {
    checkStoredWallet,
    clearExistingConnections,
    withRetryBackoff,
    restoreWalletProfile
  };
};
