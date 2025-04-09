
import { walletService } from './walletService';

/**
 * Initialize the sync service for wallet profiles
 * This will sync data from localStorage to the database when the user loads the app
 */
export const initSyncService = () => {
  // Keep track of synced wallets in this session
  const syncedWallets = new Set<string>();
  
  // Sync current wallet profile on init
  const syncCurrentWallet = async () => {
    const walletAddress = localStorage.getItem('walletAddress');
    if (walletAddress && !syncedWallets.has(walletAddress)) {
      console.log('Sync service: Syncing wallet profile for', walletAddress);
      
      // Check if we have a local profile stored
      const localProfileString = localStorage.getItem(`wallet_profile_${walletAddress}`);
      const localProfile = localProfileString ? JSON.parse(localProfileString) : null;
      
      // Always prioritize database profile during sync
      await walletService.syncWalletProfile(walletAddress, localProfile, true);
      syncedWallets.add(walletAddress);
      
      // Also store in sessionStorage to prevent duplicate syncs
      sessionStorage.setItem(`wallet_synced_${walletAddress}`, 'true');
    }
  };
  
  // Run initial sync, but wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', syncCurrentWallet);
  } else {
    syncCurrentWallet();
  }
  
  // Listen for wallet changes
  window.addEventListener('walletChanged', (event) => {
    if (event instanceof CustomEvent) {
      const walletAddress = event.detail?.wallet;
      if (walletAddress) {
        console.log('Sync service: Wallet changed, syncing profile for', walletAddress);
        
        // Get any existing local profile data
        const localProfileString = localStorage.getItem(`wallet_profile_${walletAddress}`);
        const localProfile = localProfileString ? JSON.parse(localProfileString) : null;
        
        // Remove from synced set to force a new sync
        syncedWallets.delete(walletAddress);
        
        // Always prioritize database profile during sync on wallet change
        walletService.syncWalletProfile(walletAddress, localProfile, true);
        syncedWallets.add(walletAddress);
        
        // Also store in sessionStorage to prevent duplicate syncs
        sessionStorage.setItem(`wallet_synced_${walletAddress}`, 'true');
      }
    }
  });
  
  return {
    syncWallet: async (walletAddress: string, prioritizeDb = true) => {
      if (walletAddress) {
        // Remove from synced set to force a new sync
        syncedWallets.delete(walletAddress);
        
        const localProfileString = localStorage.getItem(`wallet_profile_${walletAddress}`);
        const localProfile = localProfileString ? JSON.parse(localProfileString) : null;
        
        await walletService.syncWalletProfile(walletAddress, localProfile, prioritizeDb);
        syncedWallets.add(walletAddress);
        
        // Also store in sessionStorage to prevent duplicate syncs
        sessionStorage.setItem(`wallet_synced_${walletAddress}`, 'true');
        return true;
      }
      return false;
    },
    
    // New function to force restoration of a profile from the database
    restoreProfile: async (walletAddress: string) => {
      if (walletAddress) {
        console.log('Attempting to restore wallet profile from database for:', walletAddress);
        
        // Always prioritize database here - force true for prioritizeDb
        const profile = await walletService.syncWalletProfile(walletAddress, null, true);
        
        if (profile) {
          console.log('Successfully restored profile from database:', profile);
          // Force a wallet changed event to update the UI
          window.dispatchEvent(new CustomEvent('walletChanged', { 
            detail: { 
              action: 'profile_restored',
              wallet: walletAddress,
              time: new Date().toISOString()
            }
          }));
          return true;
        } else {
          console.log('Failed to restore profile from database for:', walletAddress);
          return false;
        }
      }
      return false;
    }
  };
};
