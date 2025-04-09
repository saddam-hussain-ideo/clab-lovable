import { WalletProvider, WalletConnectionResult, WalletConnectionOptions, walletService, WalletType } from "../walletService";
import { toast } from "sonner";
import { withRetry } from "@/utils/retry/retryUtils";
import { logDebug } from "@/utils/debugLogging";

export const solflareProvider: WalletProvider = {
  id: "solflare",
  name: "Solflare",
  description: "Solana wallet with hardware support",
  iconUrl: "https://solflare.com/assets/logo.svg",
  networks: ['mainnet', 'testnet'],
  chains: ['solana'],
  
  isAvailable: () => {
    const available = typeof window !== 'undefined' && window.solflare !== undefined;
    logDebug('WALLET', `Solflare availability check: ${available}`);
    return available;
  },
  
  connect: async (options = {}): Promise<WalletConnectionResult> => {
    try {
      logDebug('WALLET', 'Attempting to connect to Solflare wallet');
      
      if (!window.solflare) {
        toast.error("Solflare wallet not detected. Please install Solflare extension first.");
        return { 
          success: false, 
          error: 'Solflare wallet is not installed',
          address: null,
          type: null
        };
      }
      
      // Check if already connected to avoid unnecessary requests
      if (window.solflare.isConnected && window.solflare.publicKey) {
        try {
          const address = window.solflare.publicKey.toString();
          logDebug('WALLET', `Solflare already connected with address: ${address}`);
          
          // Store connection with the explicit flag
          localStorage.setItem('walletExplicitConnect', 'true');
          await walletService.handleSuccessfulConnection(address, 'solflare');
          
          // Explicitly dispatch global wallet events to ensure all components are notified
          window.dispatchEvent(new CustomEvent('globalWalletConnected', { 
            detail: { 
              address, 
              walletType: 'solflare',
              connected: true,
              network: localStorage.getItem('activeNetwork') || 'testnet'
            }
          }));
          
          return {
            success: true,
            address,
            type: 'solflare'
          };
        } catch (err) {
          // Continue with normal connection if this fails
          logDebug('WALLET', `Error checking existing Solflare connection: ${err}`);
        }
      }
      
      // Show an info toast to set expectations for the user
      toast.info('Connecting to Solflare... This may take a moment. Please wait and do not close this window.');
      
      // First, make sure any previous connection is cleared
      if (window.solflare.isConnected) {
        try {
          await window.solflare.disconnect();
          // Increased delay to ensure disconnect completes
          await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (e) {
          console.warn("Error during pre-connect disconnect:", e);
          // Continue anyway
        }
      }
      
      // Use withRetry to handle potential network issues during connection
      const connectWithRetry = async () => {
        logDebug('WALLET', 'Connecting to Solflare wallet...');
        
        try {
          // Connect to Solflare with timeout
          const connectionPromise = window.solflare.connect();
          
          // The timeout wrapper ensures we don't wait forever
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error("Solflare connection timed out")), 45000);
          });
          
          // Race the connection against the timeout
          await Promise.race([connectionPromise, timeoutPromise]);
          
          // CRITICAL: Increased initial wait time after connection
          await new Promise(resolve => setTimeout(resolve, 3500));
          
          // Try to activate the Solflare window to help it initialize
          try {
            window.focus();
            // Dispatch a click event on the document to help wake up Solflare
            document.dispatchEvent(new MouseEvent('click', {
              view: window,
              bubbles: true,
              cancelable: true
            }));
          } catch (e) {
            // Ignore errors from focus attempts
            console.warn("Error focusing window:", e);
          }
          
          // Once connected, get the public key - do this in a retry loop with better timing
          for (let attempt = 0; attempt < 15; attempt++) {  // Increased max attempts from 10 to 15
            logDebug('WALLET', `Attempt ${attempt+1}/15 to get Solflare public key`);
            
            if (window.solflare.publicKey) {
              const address = window.solflare.publicKey.toString();
              logDebug('WALLET', `Successfully got Solflare public key on attempt ${attempt+1}: ${address}`);
              return address;
            }
            
            // Try refreshing the Solflare connection by doing an activation every few attempts
            if (attempt % 3 === 2) {
              logDebug('WALLET', 'Trying window focus to help Solflare update');
              try {
                window.focus();
                // Dispatch a click event on the document to help wake up Solflare
                document.dispatchEvent(new MouseEvent('click', {
                  view: window,
                  bubbles: true,
                  cancelable: true
                }));
              } catch (e) {
                // Ignore errors from focus attempts
                console.warn("Error focusing window:", e);
              }
            }
            
            // Wait with increased time between attempts and improved backoff strategy
            const waitTime = Math.min(1000 * Math.pow(1.5, attempt), 8000);
            logDebug('WALLET', `No public key on attempt ${attempt+1}, waiting ${waitTime}ms...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
          }
          
          // Final resort: try window methods that sometimes help with extension communication
          try {
            // Try to refresh the connection one last time with a focus + blur sequence
            window.focus();
            await new Promise(resolve => setTimeout(resolve, 500));
            document.body.focus();
            await new Promise(resolve => setTimeout(resolve, 500));
            window.focus();
            
            // One final wait and check
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            if (window.solflare.publicKey) {
              const address = window.solflare.publicKey.toString();
              logDebug('WALLET', `Successfully got Solflare public key on final attempt: ${address}`);
              return address;
            }
          } catch (e) {
            console.warn("Error in last-resort attempt:", e);
          }
          
          // If we get here, we failed to get the public key
          logDebug('WALLET', 'Connected but no public key available after multiple attempts');
          throw new Error('Failed to get public key from Solflare after multiple attempts. Please try: 1) Refreshing this page, 2) Restarting your browser, or 3) Reinstalling the Solflare extension.');
        } catch (error) {
          logDebug('WALLET', `Error in Solflare connect retry: ${error}`);
          throw error;
        }
      };
      
      // Improved retry configuration with longer timeouts and more retries
      const address = await withRetry(connectWithRetry, {
        maxRetries: 4,  // Increased from 3 to 4
        minTimeout: 2000,  // Increased from 1500 to 2000
        maxTimeout: 10000,  // Increased from 6000 to 10000
        factor: 2,
        context: 'Solflare Connection',
        onRetry: (error, attempt) => {
          logDebug('WALLET', `Solflare connection retry ${attempt}: ${error.message}`);
          // Show a toast on retries so the user knows what's happening
          if (attempt > 1) {
            toast.info(`Still trying to connect to Solflare (attempt ${attempt})... Please wait.`);
          }
        }
      });
      
      if (!address) {
        return {
          success: false,
          error: 'No address returned from Solflare',
          address: null,
          type: null
        };
      }
      
      logDebug('WALLET', `Solflare connected successfully with address: ${address}`);
      
      // Store connection in wallet service
      await walletService.handleSuccessfulConnection(address, 'solflare');
      
      // Make sure global events are being dispatched
      window.dispatchEvent(new CustomEvent('globalWalletConnected', { 
        detail: { 
          address, 
          walletType: 'solflare',
          connected: true,
          network: localStorage.getItem('activeNetwork') || 'testnet'
        }
      }));
      
      toast.success("Successfully connected to Solflare wallet");
      
      return {
        success: true,
        address,
        type: 'solflare'
      };
    } catch (error: any) {
      console.error('Error connecting Solflare:', error);
      
      // Handle specific Solflare errors with more helpful messaging
      let errorMessage = 'Failed to connect Solflare';
      
      if (error.code === 4001) {
        errorMessage = 'Connection rejected by user';
      } else if (error.message?.includes('public key')) {
        errorMessage = 'Failed to get public key from Solflare. Please try: 1) Refreshing the page, 2) Restarting your browser, or 3) Checking if Solflare is properly installed.';
      } else if (error.message?.includes('timeout')) {
        errorMessage = 'Connection to Solflare timed out. Please check if Solflare extension is responsive and try again.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
      logDebug('WALLET', `Solflare connection error: ${errorMessage}`);
      
      // Also dispatch a failure event
      window.dispatchEvent(new CustomEvent('globalWalletConnected', { 
        detail: { 
          connected: false,
          error: errorMessage
        }
      }));
      
      return {
        success: false,
        error: errorMessage,
        address: null,
        type: null
      };
    }
  },
  
  disconnect: async (): Promise<boolean> => {
    try {
      logDebug('WALLET', 'Disconnecting Solflare wallet');
      
      if (window.solflare) {
        await window.solflare.disconnect();
        toast.success("Disconnected from Solflare wallet");
      }
      
      walletService.clearWalletConnection();
      walletService.dispatchWalletEvent(false);
      
      // Explicitly dispatch global wallet disconnected event to ensure all components are notified
      window.dispatchEvent(new CustomEvent('globalWalletConnected', {
        detail: { 
          connected: false
        }
      }));
      
      return true;
    } catch (error) {
      console.error('Error disconnecting Solflare wallet:', error);
      toast.error("Failed to disconnect from Solflare wallet");
      return false;
    }
  },
  
  verifyConnection: async (): Promise<boolean> => {
    try {
      if (!window.solflare) {
        return false;
      }
      
      // Important: Only check the current state, don't try to connect
      const isConnected = window.solflare.isConnected;
      const publicKey = window.solflare.publicKey;
      
      const connected = isConnected && !!publicKey;
      
      logDebug('WALLET', `Solflare verification result: ${connected ? 'connected' : 'disconnected'}`);
      if (connected && publicKey) {
        logDebug('WALLET', `Solflare connected to address: ${publicKey.toString()}`);
      }
      
      return connected;
    } catch (error) {
      console.error('Error verifying Solflare connection:', error);
      return false;
    }
  },
  
  getAccounts: async (): Promise<string[]> => {
    try {
      if (!window.solflare || !window.solflare.isConnected || !window.solflare.publicKey) {
        return [];
      }
      
      return [window.solflare.publicKey.toString()];
    } catch (error) {
      console.error('Error getting Solflare accounts:', error);
      return [];
    }
  }
};
