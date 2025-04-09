// Define the base interface for Ethereum Provider
interface EthereumProvider {
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

// Define WalletConnect provider interface
interface WalletConnectProvider {
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  request: (args: {method: string; params?: any[]}) => Promise<any>;
  on: (event: string, handler: (...args: any[]) => void) => void;
  removeListener: (event: string, handler: (...args: any[]) => void) => void;
  accounts?: string[];
  chainId?: string;
  isConnected?: boolean;
}

// Define Phantom provider interface
interface PhantomProvider {
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

// Define Phantom Ethereum provider
interface PhantomEthereumProvider extends EthereumProvider {
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
interface SolflareProvider {
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
interface Coin98Provider {
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
interface SuiWallet {
  hasPermissions?: () => Promise<boolean>;
  requestPermissions?: () => Promise<void>;
  getAccounts?: () => Promise<string[]>;
  requestAccounts?: () => Promise<string[]>;
  disconnect?: () => Promise<void>;
}

// Define Coinbase wallet interface
interface CoinbaseWalletProvider {
  isConnected?: boolean;
  accounts?: string[];
  request?: (args: { method: string, params?: any[] }) => Promise<any>;
  isCoinbaseWallet: boolean;
  _isCoinbaseWallet?: boolean;
  providerName?: string;
}

// Function to check if Phantom Ethereum is available
function isPhantomEthereumAvailable(): boolean;

// Export types
export { 
  PhantomProvider, 
  PhantomEthereumProvider, 
  SolflareProvider, 
  EthereumProvider, 
  Coin98Provider, 
  CoinbaseWalletProvider,
  SuiWallet,
  WalletConnectProvider,
  isPhantomEthereumAvailable
};
