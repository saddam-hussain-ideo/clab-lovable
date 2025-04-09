import { WalletProvider, WalletConnectionOptions, WalletConnectionResult, WalletType } from './walletService';
import { walletConnectProvider } from './providers/walletConnectProvider';
import { metamaskProvider } from './providers/metamaskProvider';
import { phantom_ethereumProvider } from './providers/phantom_ethereumProvider';
import { phantomProvider } from './providers/phantomProvider';
import { solflareProvider } from './providers/solflareProvider';
import { logDebug } from '@/utils/debugLogging';
import { walletSessionManager } from './walletSessionManager';

/**
 * Registry for all wallet providers
 */
class WalletRegistry {
  private _providers: WalletProvider[] = [];
  
  constructor() {
    // Register all wallet providers
    this.registerProvider(walletConnectProvider);
    this.registerProvider(metamaskProvider);
    this.registerProvider(phantomProvider);
    this.registerProvider(phantom_ethereumProvider);
    this.registerProvider(solflareProvider);
  }
  
  /**
   * Register a wallet provider
   */
  registerProvider(provider: WalletProvider): void {
    if (!this._providers.some(p => p.id === provider.id)) {
      this._providers.push(provider);
      logDebug('WALLET_REGISTRY', `Registered wallet provider: ${provider.id}`);
    }
  }
  
  /**
   * Get all registered wallet providers
   */
  get providers(): WalletProvider[] {
    return this._providers;
  }
  
  /**
   * Get a wallet provider by ID
   */
  getProvider(id: WalletType): WalletProvider | undefined {
    return this._providers.find(p => p.id === id);
  }
  
  /**
   * Connect to a wallet using its provider
   */
  async connectWallet(
    walletId: WalletType, 
    options?: WalletConnectionOptions
  ): Promise<WalletConnectionResult> {
    const provider = this.getProvider(walletId);
    
    if (!provider) {
      logDebug('WALLET_REGISTRY', `Provider not found for wallet: ${walletId}`);
      return {
        success: false,
        error: `Wallet provider not found: ${walletId}`,
        address: null,
        type: null
      };
    }
    
    if (!provider.isAvailable()) {
      logDebug('WALLET_REGISTRY', `Wallet is not available: ${walletId}`);
      return {
        success: false,
        error: `Wallet is not available: ${provider.name}`,
        address: null,
        type: null
      };
    }
    
    try {
      // Disconnect any existing wallet first
      await this.disconnectWallet();
      
      logDebug('WALLET_REGISTRY', `Connecting to wallet: ${walletId}`);
      const result = await provider.connect(options);
      
      if (result.success && result.address) {
        // Start a completely isolated wallet session
        await walletSessionManager.startNewSession(walletId, result.address);
        
        logDebug('WALLET_REGISTRY', `Successfully connected to ${walletId}: ${result.address}`);
      }
      
      return result;
    } catch (error: any) {
      logDebug('WALLET_REGISTRY', `Error connecting to wallet: ${error.message}`);
      return {
        success: false,
        error: error.message || `Failed to connect to ${provider.name}`,
        address: null,
        type: null
      };
    }
  }
  
  /**
   * Disconnect from the current wallet
   */
  async disconnectWallet(): Promise<boolean> {
    const walletType = localStorage.getItem('walletType') as WalletType | null;
    
    if (!walletType) {
      return true; // No wallet connected
    }
    
    const provider = this.getProvider(walletType);
    
    if (!provider) {
      // If no provider found, just clear the session
      await walletSessionManager.endCurrentSession();
      return true;
    }
    
    try {
      logDebug('WALLET_REGISTRY', `Disconnecting from wallet: ${walletType}`);
      const success = await provider.disconnect();
      
      // End the wallet session regardless of the provider's success
      await walletSessionManager.endCurrentSession();
      
      return success;
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
      
      // Still try to end the session even if the provider fails
      await walletSessionManager.endCurrentSession();
      
      return false;
    }
  }
  
  /**
   * Get available wallet providers that can be used in the current environment
   */
  getAvailableProviders(): WalletProvider[] {
    return this._providers.filter(p => p.isAvailable());
  }
}

// Create and export a singleton instance
export const walletRegistry = new WalletRegistry();
