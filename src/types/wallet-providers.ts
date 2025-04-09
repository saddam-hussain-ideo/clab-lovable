
export type Network = 'mainnet' | 'testnet';

// Define the base interface for Ethereum Provider
export interface EthereumProvider {
  isMetaMask?: boolean;
  _metamask?: any;
  isCoinbaseWallet?: boolean;
  _isCoinbaseWallet?: boolean; 
  isPhantom?: boolean;
  request: (args: {method: string; params?: any[]}) => Promise<any>;
  on: (event: string, handler: (...args: any[]) => void) => void;
  removeListener: (event: string, handler: (...args: any[]) => void) => void;
  providers?: EthereumProvider[]; 
  selectedAddress?: string;
  chainId?: string;
  networkVersion?: string;
  isConnected?: boolean;
  disconnect?: () => Promise<void>;
  // Add additional provider detection properties
  providerName?: string;
  isWeb3?: boolean;
  isBraveWallet?: boolean;
  isTokenPocket?: boolean;
  isTokenary?: boolean;
  isStatus?: boolean;
  isTrust?: boolean;
  isTally?: boolean;
  host?: string;
  path?: string;
}

// Define Phantom provider interface
export interface PhantomSolanaProvider {
  isPhantom?: boolean;
  publicKey?: { toString: () => string };
  connect: (options?: { onlyIfTrusted?: boolean }) => Promise<{ publicKey: { toString: () => string } }>;
  disconnect: () => Promise<void>;
  signTransaction?: (transaction: any) => Promise<any>;
  signAllTransactions?: (transactions: any[]) => Promise<any[]>;
  signMessage?: (message: Uint8Array) => Promise<{ signature: Uint8Array }>;
  signAndSendTransaction?: (transaction: any) => Promise<any>;
  isConnected?: boolean;
  on: (event: string, handler: (...args: any[]) => void) => void;
  off: (event: string, handler: (...args: any[]) => void) => void;
  request: (params: { method: string; params: any }) => Promise<{ signature: string }>;
}

// Define Phantom Ethereum provider as an extension of EthereumProvider
export interface PhantomEthereumProvider extends EthereumProvider {
  isPhantom: boolean;
  request: (args: {method: string; params?: any[]}) => Promise<any>;
  on: (event: string, handler: (...args: any[]) => void) => void;
  removeListener: (event: string, handler: (...args: any[]) => void) => void;
  selectedAddress?: string;
  isConnected?: boolean;
  chainId?: string;
  networkVersion?: string;
  _state?: any;
  _metamask?: any;
  _events?: any;
  enable?: () => Promise<string[]>;
  sendAsync?: (payload: any, callback: (error: any, response: any) => void) => void;
  send?: (payload: any, callback: (error: any, response: any) => void) => void;
}

// Define Solflare provider interface with more explicit types
export interface SolflareProvider {
  isSolflare?: boolean;
  publicKey?: { toString: () => string };
  isConnected: boolean;
  connect: () => Promise<{ publicKey: { toString: () => string } }>;
  disconnect: () => Promise<void>;
  signTransaction?: (transaction: any) => Promise<any>;
  signAllTransactions?: (transactions: any[]) => Promise<any[]>;
  signMessage?: (message: Uint8Array) => Promise<{ signature: Uint8Array }>;
  signAndSendTransaction?: (transaction: any) => Promise<any>;
  on: (event: string, handler: (...args: any[]) => void) => void;
  off?: (event: string, handler: (...args: any[]) => void) => void;
}

// Define Coin98 provider interface
export interface Coin98Provider {
  connect: () => Promise<{ publicKey: { toString: () => string } }>;
  disconnect: () => Promise<void>;
  publicKey?: { toString: () => string };
  on: (event: string, callback: (args: any) => void) => void;
  off?: (event: string, callback: (args: any) => void) => void;
  signTransaction?: (transaction: any) => Promise<any>;
  signAllTransactions?: (transactions: any[]) => Promise<any[]>;
  signMessage?: (message: Uint8Array) => Promise<{ signature: Uint8Array }>;
  request?: (params: { method: string; params: any }) => Promise<any>;
}

// Define SUI wallet interface
export interface SuiWallet {
  hasPermissions?: () => Promise<boolean>;
  requestPermissions?: () => Promise<void>;
  getAccounts?: () => Promise<string[]>;
  requestAccounts?: () => Promise<string[]>;
  disconnect?: () => Promise<void>;
}

// Define Coinbase wallet interface
export interface CoinbaseWalletProvider {
  isConnected?: boolean;
  accounts?: string[];
  request?: (args: { method: string, params?: any[] }) => Promise<any>;
  isCoinbaseWallet: boolean;
  _isCoinbaseWallet?: boolean;
  providerName?: string;
}

// Utility functions for wallet detection
export const isCoinbaseProvider = (provider: EthereumProvider): boolean => {
  return !!provider.isCoinbaseWallet || !!provider._isCoinbaseWallet;
};

export const isRealMetaMaskProvider = (provider: EthereumProvider): boolean => {
  return !!provider.isMetaMask && !provider.isCoinbaseWallet && !provider._isCoinbaseWallet;
};

// Function to check if Phantom Ethereum is available
export const isPhantomEthereumAvailable = (): boolean => {
  return typeof window !== 'undefined' && 
         window.phantom !== undefined && 
         window.phantom.ethereum !== undefined;
};
