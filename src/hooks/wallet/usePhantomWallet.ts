
import { useState } from 'react';
import { toast } from 'sonner';
import { logDebug } from '@/utils/debugLogging';
import { walletStorageService } from '@/services/wallet/walletStorageService';
import { walletService } from '@/lib/services/walletService';
import { isPhantomSolanaAvailable } from '@/utils/wallet/phantom';
import { WalletConnectionResult } from '@/types/wallet-connection';

/**
 * Hook for Phantom Solana wallet connections
 */
export const usePhantomWallet = () => {
  const connectPhantomWallet = async (): Promise<WalletConnectionResult> => {
    try {
      if (!isPhantomSolanaAvailable()) {
        logDebug('WALLET', 'Phantom wallet is not installed');
        toast.error('Phantom wallet is not installed');
        window.open('https://phantom.app/download', '_blank');
        return { success: false, error: 'Phantom wallet is not installed' };
      }
      
      try {
        logDebug('WALLET', 'Connecting to Phantom Solana wallet');
        
        // First check if we're already connected
        if (window.phantom?.solana?.isConnected && window.phantom?.solana?.publicKey) {
          const publicKey = window.phantom.solana.publicKey;
          const address = publicKey.toString();
          const currentWalletType = 'phantom';
          
          logDebug('WALLET', `Already connected to Phantom: ${address}`);
          
          walletStorageService.storeConnection(address, currentWalletType);
          
          try {
            await walletService.logConnection(address, currentWalletType);
            await walletService.ensureWalletProfile(address, currentWalletType);
          } catch (err) {
            console.warn("Non-critical error ensuring wallet profile:", err);
          }
          
          // Dispatch wallet connection event to notify other components
          window.dispatchEvent(new CustomEvent('walletChanged', {
            detail: {
              action: 'connected',
              wallet: address,
              walletType: currentWalletType,
              time: new Date().toISOString()
            }
          }));
          
          walletStorageService.dispatchWalletEvent('connected', address, currentWalletType);
          
          // Force a local storage event so components listening to storage changes can react
          localStorage.setItem('temporaryWalletFlag', Date.now().toString());
          localStorage.removeItem('temporaryWalletFlag');
          
          return { success: true, address, type: currentWalletType };
        }
        
        // If not already connected, try connecting
        logDebug('WALLET', 'Not currently connected, initiating Phantom connect');
        const { publicKey } = await window.phantom.solana.connect();
        const address = publicKey.toString();
        const currentWalletType = 'phantom';
        
        logDebug('WALLET', `Connected to Phantom with address: ${address}`);
        
        walletStorageService.storeConnection(address, currentWalletType);
        
        try {
          await walletService.logConnection(address, currentWalletType);
          await walletService.ensureWalletProfile(address, currentWalletType);
        } catch (err) {
          console.warn("Non-critical error ensuring wallet profile:", err);
        }
        
        // Dispatch wallet connection event to notify other components
        window.dispatchEvent(new CustomEvent('walletChanged', {
          detail: {
            action: 'connected',
            wallet: address,
            walletType: currentWalletType,
            time: new Date().toISOString()
          }
        }));
        
        walletStorageService.dispatchWalletEvent('connected', address, currentWalletType);
        
        // Force a local storage event so components listening to storage changes can react
        localStorage.setItem('temporaryWalletFlag', Date.now().toString());
        localStorage.removeItem('temporaryWalletFlag');
        
        return { success: true, address, type: currentWalletType };
      } catch (error: any) {
        console.error('Error connecting Phantom:', error);
        logDebug('WALLET', `Error connecting Phantom: ${error.message || error}`);
        
        if (error.code === 4001) {
          toast.error('Connection rejected by user');
        } else {
          toast.error(error.message || 'Failed to connect Phantom');
        }
        return { success: false, error: error?.message || 'Failed to connect Phantom' };
      }
    } catch (error: any) {
      console.error('Error in connectPhantomWallet:', error);
      return { success: false, error: error?.message || 'Unknown error connecting Phantom wallet' };
    }
  };

  const disconnectPhantomWallet = async (): Promise<WalletConnectionResult> => {
    try {
      if (window.phantom?.solana) {
        await window.phantom.solana.disconnect();
        logDebug('WALLET', 'Disconnected from Phantom Solana wallet');
      }
      
      return { success: true };
    } catch (error: any) {
      console.error('Error disconnecting Phantom wallet:', error);
      return { success: false, error: error?.message || 'Error disconnecting Phantom wallet' };
    }
  };

  return {
    connectPhantomWallet,
    disconnectPhantomWallet
  };
};
