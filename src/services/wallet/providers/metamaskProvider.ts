import { WalletProvider, WalletConnectionOptions, WalletConnectionResult } from '../walletService';
import { getMetaMaskProvider } from '@/utils/wallet/metamask';
import { logDebug } from '@/utils/debugLogging';
import { toast } from 'sonner';

class MetaMaskProvider implements WalletProvider {
  id = 'metamask';
  name = 'MetaMask';
  description = "Connect with MetaMask";
  iconUrl = "https://raw.githubusercontent.com/MetaMask/brand-resources/master/SVG/metamask-fox.svg";
  networks = ['mainnet', 'testnet'];
  chains = ['ethereum'];

  async isAvailable(): Promise<boolean> {
    const provider = await getMetaMaskProvider();
    return provider !== null;
  }

  async connect(options?: WalletConnectionOptions): Promise<WalletConnectionResult> {
    try {
      const provider = await getMetaMaskProvider();

      if (!provider) {
        throw new Error('MetaMask provider not found');
      }

      if (!provider.request || typeof provider.request !== 'function') {
        throw new Error('Invalid MetaMask provider: missing request method');
      }

      // Request account access
      const accounts = await provider.request({
        method: 'eth_requestAccounts'
      });

      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found');
      }

      const address = accounts[0];

      // Store the connection in localStorage
      localStorage.setItem('walletAddress', address);
      localStorage.setItem('walletType', 'metamask');
      localStorage.setItem('walletConnectedAt', Date.now().toString());

      logDebug('METAMASK_PROVIDER', `Connected to address: ${address}`);

      return {
        success: true,
        address,
        type: 'metamask',
        error: null
      };
    } catch (error: any) {
      logDebug('METAMASK_PROVIDER', `Error connecting: ${error.message}`);

      // Show user-friendly error message
      if (error.code === 4001) {
        toast.error('Connection rejected by user');
      } else {
        toast.error(`Failed to connect: ${error.message}`);
      }

      return {
        success: false,
        error: error.message,
        address: null,
        type: null
      };
    }
  }

  async disconnect(): Promise<boolean> {
    try {
      const provider = await getMetaMaskProvider();

      if (provider?.disconnect) {
        await provider.disconnect();
      }

      // Clear connection from localStorage
      localStorage.removeItem('walletAddress');
      localStorage.removeItem('walletType');
      localStorage.removeItem('walletConnectedAt');

      return true;
    } catch (error) {
      console.error('Error disconnecting MetaMask:', error);
      return false;
    }
  }

  async verifyConnection(): Promise<boolean> {
    try {
      // Instead of checking the provider which might trigger auto-connection,
      // check localStorage first to see if there was a valid connection
      const walletType = localStorage.getItem('walletType');
      const walletAddress = localStorage.getItem('walletAddress');

      // If this isn't a metamask connection in localStorage, fail fast
      if (walletType !== 'metamask' || !walletAddress) {
        logDebug('WALLET', 'MetaMask verification failed: no valid MetaMask connection in localStorage');
        return false;
      }

      // ONLY check the provider if we already have a metamask connection in localStorage
      const provider = await getMetaMaskProvider();

      if (!provider) {
        logDebug('WALLET', 'MetaMask verification failed: provider not found');
        return false;
      }

      // Use eth_accounts (read-only) to check if still connected
      const accounts = await provider.request({ method: 'eth_accounts' });
      const hasAccounts = Array.isArray(accounts) && accounts.length > 0;

      // Additionally verify the stored address matches the current account
      const addressMatches = hasAccounts && accounts[0].toLowerCase() === walletAddress.toLowerCase();

      const isConnected = hasAccounts && addressMatches;

      logDebug('WALLET', `MetaMask verification result: ${isConnected ? 'connected' : 'disconnected'} (hasAccounts: ${hasAccounts}, addressMatches: ${addressMatches})`);
      if (isConnected) {
        logDebug('WALLET', `MetaMask connected to address: ${accounts[0]}`);
      }

      return isConnected;
    } catch (error) {
      console.error('Error verifying MetaMask connection:', error);
      return false;
    }
  }

  async getAccounts(): Promise<string[]> {
    try {
      // Check localStorage first to avoid unnecessary provider calls
      const walletType = localStorage.getItem('walletType');
      const walletAddress = localStorage.getItem('walletAddress');

      // If this is a metamask connection in localStorage, return the address
      if (walletType === 'metamask' && walletAddress) {
        logDebug('WALLET', `Using cached MetaMask account from localStorage: ${walletAddress}`);
        return [walletAddress];
      }

      // No valid connection in localStorage, check the provider
      const provider = await getMetaMaskProvider();

      if (!provider) {
        return [];
      }

      const accounts = await provider.request({ method: 'eth_accounts' });
      logDebug('WALLET', `getAccounts found ${accounts?.length || 0} MetaMask accounts`);
      return Array.isArray(accounts) ? accounts : [];
    } catch (error) {
      console.error('Error getting MetaMask accounts:', error);
      return [];
    }
  }
}

export const metamaskProvider = new MetaMaskProvider();
