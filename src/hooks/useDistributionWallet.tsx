
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { logDebug } from '@/utils/debugLogging';
import { simpleSolflareConnect } from '@/utils/wallet/simpleSolflareConnect';

type WalletType = 'phantom' | 'solflare' | null;

interface UseDistributionWalletResult {
  isConnected: boolean;
  isConnecting: boolean;
  walletAddress: string | null;
  walletType: WalletType;
  wallet: any;
  connectPhantom: () => Promise<boolean>;
  connectSolflare: () => Promise<boolean>;
  disconnect: () => Promise<void>;
}

export function useDistributionWallet(): UseDistributionWalletResult {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [walletType, setWalletType] = useState<WalletType>(null);
  const [wallet, setWallet] = useState<any>(null);

  // Initialize wallet status on mount
  useEffect(() => {
    const checkExistingConnection = async () => {
      try {
        if (window.phantom?.solana) {
          if (window.phantom.solana.isConnected && window.phantom.solana.publicKey) {
            const address = window.phantom.solana.publicKey.toString();
            setWalletAddress(address);
            setWalletType('phantom');
            setIsConnected(true);
            setWallet(window.phantom.solana);
            logDebug('DISTRIBUTION_WALLET', `Already connected to Phantom: ${address}`);
          }
        } else if (window.solflare) {
          if (window.solflare.isConnected && window.solflare.publicKey) {
            const address = window.solflare.publicKey.toString();
            setWalletAddress(address);
            setWalletType('solflare');
            setIsConnected(true);
            setWallet(window.solflare);
            logDebug('DISTRIBUTION_WALLET', `Already connected to Solflare: ${address}`);
          }
        }
      } catch (error) {
        console.error('Error checking existing wallet connection:', error);
      }
    };

    checkExistingConnection();
    
    // Set up event listeners for wallet connection changes
    const handleWalletConnectionChange = () => {
      checkExistingConnection();
    };
    
    window.addEventListener('focus', handleWalletConnectionChange);
    
    return () => {
      window.removeEventListener('focus', handleWalletConnectionChange);
    };
  }, []);

  // Connect to Phantom wallet
  const connectPhantom = async (): Promise<boolean> => {
    setIsConnecting(true);
    
    try {
      logDebug('DISTRIBUTION_WALLET', 'Connecting to Phantom wallet for distribution');
      
      if (!window.phantom?.solana) {
        toast.error('Phantom wallet is not installed');
        return false;
      }
      
      // Disconnect any existing connection first to ensure fresh connection
      try {
        if (window.phantom.solana.isConnected) {
          await window.phantom.solana.disconnect();
          await new Promise(resolve => setTimeout(resolve, 500)); // Short delay before reconnecting
        }
      } catch (err) {
        console.warn("Error during phantom pre-disconnect:", err);
      }
      
      // Now connect
      const connection = await window.phantom.solana.connect();
      
      // Verify that we received a valid connection with public key
      if (!connection || !connection.publicKey) {
        throw new Error('Failed to get public key from Phantom');
      }
      
      const address = connection.publicKey.toString();
      
      // Additional validation of the returned wallet
      if (!window.phantom.solana.publicKey) {
        throw new Error('Phantom wallet connected but publicKey is missing');
      }
      
      setWalletAddress(address);
      setWalletType('phantom');
      setIsConnected(true);
      setWallet(window.phantom.solana);
      
      // Verify that required methods are available
      if (!window.phantom.solana.signTransaction) {
        console.warn('Phantom wallet is missing signTransaction method');
        toast.warning('Connected wallet may have limited functionality');
      }
      
      toast.success('Connected to Phantom wallet for token distribution');
      logDebug('DISTRIBUTION_WALLET', `Connected to Phantom: ${address}`);
      
      return true;
    } catch (error: any) {
      console.error('Error connecting to Phantom wallet:', error);
      toast.error(error.message || 'Failed to connect to Phantom wallet');
      return false;
    } finally {
      setIsConnecting(false);
    }
  };

  // Connect to Solflare wallet - improved implementation
  const connectSolflare = async (): Promise<boolean> => {
    setIsConnecting(true);
    
    try {
      logDebug('DISTRIBUTION_WALLET', 'Connecting to Solflare wallet for distribution');
      
      if (!window.solflare) {
        toast.error('Solflare wallet is not installed');
        return false;
      }
      
      // Try the simplified direct connection approach first
      const directResult = await simpleSolflareConnect();
      
      if (directResult.success && directResult.address) {
        const address = directResult.address;
        
        // Update our state with the direct connection
        setWalletAddress(address);
        setWalletType('solflare');
        setIsConnected(true);
        setWallet(window.solflare);
        
        logDebug('DISTRIBUTION_WALLET', `Connected to Solflare via direct approach: ${address}`);
        return true;
      }
      
      // If direct connection fails, fall back to the existing approach
      
      // Disconnect any existing connection first to ensure fresh connection
      try {
        if (window.solflare.isConnected) {
          await window.solflare.disconnect();
          // Larger delay before reconnecting to ensure proper disconnect
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      } catch (err) {
        console.warn("Error during solflare pre-disconnect:", err);
      }
      
      // Now connect
      await window.solflare.connect();
      
      // Improved: Wait longer for Solflare to update its state - increased from 3500ms to 5000ms
      await new Promise(resolve => setTimeout(resolve, 5000));
      
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
      
      // Retry logic for getting the public key with improved timing and more attempts
      let publicKey = null;
      let attempts = 0;
      const maxAttempts = 15; // Increased from 10 to 15
      
      while (attempts < maxAttempts) {
        logDebug('DISTRIBUTION_WALLET', `Attempt ${attempts + 1}/${maxAttempts} to get Solflare public key`);
        
        if (window.solflare.publicKey) {
          publicKey = window.solflare.publicKey;
          break;
        }
        
        // Try refreshing the Solflare connection by doing an activation every few attempts
        if (attempts % 3 === 2) {
          logDebug('DISTRIBUTION_WALLET', 'Trying window focus to help Solflare update');
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
        
        // Wait with improved exponential backoff and increased base wait time
        const delay = Math.min(1000 * Math.pow(1.5, attempts), 8000);
        logDebug('DISTRIBUTION_WALLET', `No public key yet, waiting ${delay}ms before next attempt...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        attempts++;
      }
      
      // Last resort: try a focus + blur sequence which sometimes helps Solflare update
      if (!publicKey) {
        logDebug('DISTRIBUTION_WALLET', 'Trying final window focus sequence to trigger Solflare update');
        
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
            publicKey = window.solflare.publicKey;
            logDebug('DISTRIBUTION_WALLET', 'Final focus sequence helped get public key');
          }
        } catch (e) {
          console.warn("Error in last-resort attempt:", e);
        }
      }
      
      // If we still don't have a public key after all attempts, throw an error
      if (!publicKey) {
        throw new Error('Failed to get public key from Solflare after multiple attempts. Please try reloading the page, restarting your browser, or checking your Solflare extension.');
      }
      
      const address = publicKey.toString();
      
      setWalletAddress(address);
      setWalletType('solflare');
      setIsConnected(true);
      setWallet(window.solflare);
      
      // Verify that required methods are available
      if (!window.solflare.signTransaction) {
        console.warn('Solflare wallet is missing signTransaction method');
        toast.warning('Connected wallet may have limited functionality');
      }
      
      toast.success('Connected to Solflare wallet for token distribution');
      logDebug('DISTRIBUTION_WALLET', `Connected to Solflare: ${address}`);
      
      return true;
    } catch (error: any) {
      console.error('Error connecting to Solflare wallet:', error);
      
      // More specific error messages to help users
      if (error.code === 4001) {
        toast.error('Connection rejected by user');
      } else if (error.message?.includes('public key')) {
        toast.error('Failed to get public key from Solflare. Please try reloading the page, restarting your browser, or checking your Solflare extension.');
      } else {
        toast.error(error.message || 'Failed to connect to Solflare wallet');
      }
      
      return false;
    } finally {
      setIsConnecting(false);
    }
  };

  // Disconnect wallet
  const disconnect = useCallback(async (): Promise<void> => {
    try {
      if (walletType === 'phantom' && window.phantom?.solana) {
        await window.phantom.solana.disconnect();
      } else if (walletType === 'solflare' && window.solflare) {
        await window.solflare.disconnect();
      }
      
      setWalletAddress(null);
      setWalletType(null);
      setIsConnected(false);
      setWallet(null);
      
      toast.success('Wallet disconnected');
      logDebug('DISTRIBUTION_WALLET', 'Wallet disconnected');
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
      toast.error('Failed to disconnect wallet');
    }
  }, [walletType]);

  return {
    isConnected,
    isConnecting,
    walletAddress,
    walletType,
    wallet,
    connectPhantom,
    connectSolflare,
    disconnect
  };
}
