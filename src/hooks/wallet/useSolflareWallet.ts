
import { toast } from 'sonner';
import { logDebug } from '@/utils/debugLogging';
import { walletStorageService } from '@/services/wallet/walletStorageService';
import { walletService } from '@/lib/services/walletService';
import { connectSolflareWallet, disconnectSolflareWallet, debugSolflareState } from '@/utils/wallet/solflare';
import { simpleSolflareConnect } from '@/utils/wallet/simpleSolflareConnect';
import { WalletConnectionResult } from '@/types/wallet-connection';

/**
 * Hook for Solflare wallet connections
 */
export const useSolflareWallet = () => {
  const connectSolflare = async (): Promise<WalletConnectionResult> => {
    try {
      logDebug('WALLET', 'Connecting to Solflare wallet - starting enhanced connection process');
      
      try {
        debugSolflareState();
        
        // First, try the simplified direct connection approach
        const directResult = await simpleSolflareConnect();
        
        if (directResult.success && directResult.address) {
          const address = directResult.address;
          const currentWalletType = 'solflare';
          
          walletStorageService.storeConnection(address, currentWalletType);
          
          debugSolflareState();
          
          try {
            await walletService.logConnection(address, currentWalletType);
            await walletService.ensureWalletProfile(address, currentWalletType);
            logDebug('WALLET', `Connected to Solflare with address: ${address}`);
          } catch (err) {
            console.warn("Non-critical error ensuring wallet profile:", err);
          }
          
          walletStorageService.dispatchWalletEvent('connected', address, currentWalletType);
          
          return { success: true, address, type: currentWalletType };
        }
        
        // If the direct approach fails, fall back to the original method
        logDebug('WALLET', 'Direct Solflare connection failed, trying fallback method');
        
        const address = await connectSolflareWallet();
        
        if (address) {
          const currentWalletType = 'solflare';
          
          walletStorageService.storeConnection(address, currentWalletType);
          
          debugSolflareState();
          
          if (!window.solflare?.isConnected || !window.solflare?.publicKey) {
            logDebug('WALLET', 'Solflare connection state mismatch after connection');
            
            // Try one more time to check if we actually have a connection
            if (window.solflare && window.solflare.isConnected) {
              // Wait a moment for the publicKey to become available
              await new Promise(resolve => setTimeout(resolve, 3000));
              
              if (window.solflare.publicKey) {
                const recoveredAddress = window.solflare.publicKey.toString();
                logDebug('WALLET', `Recovered Solflare address after delay: ${recoveredAddress}`);
                
                // Store the recovered connection
                walletStorageService.storeConnection(recoveredAddress, currentWalletType);
                walletStorageService.dispatchWalletEvent('connected', recoveredAddress, currentWalletType);
                
                return { success: true, address: recoveredAddress, type: currentWalletType };
              }
            }
            
            // If we still don't have a connection, throw an error
            throw new Error('Solflare connection state mismatch. Please try again.');
          }
          
          try {
            await walletService.logConnection(address, currentWalletType);
            await walletService.ensureWalletProfile(address, currentWalletType);
            logDebug('WALLET', `Connected to Solflare with address: ${address}`);
          } catch (err) {
            console.warn("Non-critical error ensuring wallet profile:", err);
          }
          
          walletStorageService.dispatchWalletEvent('connected', address, currentWalletType);
          
          return { success: true, address, type: currentWalletType };
        } else {
          debugSolflareState();
          throw new Error('Failed to get address from Solflare');
        }
      } catch (error: any) {
        console.error('Error connecting Solflare:', error);
        debugSolflareState();
        if (error.code === 4001) {
          toast.error('Connection rejected by user');
        } else if (error.message?.includes('public key')) {
          toast.error('Failed to get public key from Solflare. Please refresh the page and try again.');
        } else {
          toast.error(error.message || 'Failed to connect Solflare');
        }
        return { success: false, error: error?.message || 'Failed to connect Solflare' };
      }
    } catch (error: any) {
      console.error('Error connecting Solflare wallet:', error);
      return { success: false, error: error?.message || 'Error connecting Solflare wallet' };
    }
  };

  const disconnectSolflare = async (): Promise<WalletConnectionResult> => {
    try {
      await disconnectSolflareWallet();
      logDebug('WALLET', 'Disconnected from Solflare wallet');
      return { success: true };
    } catch (error: any) {
      console.error('Error disconnecting Solflare wallet:', error);
      return { success: false, error: error?.message || 'Error disconnecting Solflare wallet' };
    }
  };

  return {
    connectSolflare,
    disconnectSolflare
  };
};
