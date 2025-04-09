import { walletSessionManager } from '@/services/wallet/walletSessionManager';
import { logDebug } from './debugLogging';
import { toast } from 'sonner';

/**
 * Force a complete reset of the application state
 * This is a nuclear option for when wallet sessions get corrupted
 */
export const forceGlobalReset = async () => {
  logDebug('GLOBAL_RESET', 'Forcing global application reset');
  
  try {
    // Display toast notification
    toast.info('Resetting application state...', {
      duration: 3000
    });
    
    // End current wallet session
    await walletSessionManager.endCurrentSession();
    
    // Clear React Query cache
    window.dispatchEvent(new CustomEvent('clearQueryCache', {
      detail: { timestamp: Date.now() }
    }));
    
    // Clear component state
    window.dispatchEvent(new CustomEvent('resetApplicationState', {
      detail: { timestamp: Date.now() }
    }));
    
    // Give a moment for cleanup to complete
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Reload the application
    window.location.reload();
  } catch (error) {
    console.error('Error during global reset:', error);
    
    // If everything fails, force reload
    window.location.reload();
  }
};

/**
 * Perform a soft reset that clears caches but doesn't reload the page
 */
export const softReset = async () => {
  logDebug('GLOBAL_RESET', 'Performing soft application reset');
  
  try {
    // Display toast notification
    toast.info('Clearing application cache...', {
      duration: 2000
    });
    
    // Clear React Query cache
    window.dispatchEvent(new CustomEvent('clearQueryCache', {
      detail: { timestamp: Date.now() }
    }));
    
    // Reset components that listen for this event
    window.dispatchEvent(new CustomEvent('softReset', {
      detail: { timestamp: Date.now() }
    }));
    
    return true;
  } catch (error) {
    console.error('Error during soft reset:', error);
    return false;
  }
};
