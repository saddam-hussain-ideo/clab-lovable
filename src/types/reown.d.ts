declare module '@reown/sdk' {
  export interface AppKitOptions {
    view?: string;
    namespace?: 'solana' | 'eip155';
    filters?: {
      wallets?: string[];
    };
    features?: {
      socials?: boolean;
      modal?: boolean;
    };
  }

  export interface AppKitResult {
    address: string;
    type?: string;
  }

  export interface WalletInfo {
    name: string;
    type?: string;
    chain?: string;
  }

  export class AppKit {
    static getInstance(): AppKit;
    open(options: AppKitOptions): Promise<AppKitResult>;
    disconnect(): Promise<void>;
    isConnected(): Promise<boolean>;
    getAddress(): Promise<string>;
    getChainId(): Promise<string>;
    getWalletInfo(): Promise<WalletInfo>;
  }
}

declare module '@reown/appkit/react' {
  import { AppKit } from '@reown/sdk';
  
  interface Features {
    analytics?: boolean;
    socials?: boolean;
    email?: boolean;
    emailShowWallets?: boolean;
    modal?: boolean;
  }

  interface CreateAppKitOptions {
    adapters: any[];
    networks: any[];
    projectId: string;
    metadata: {
      name: string;
      description: string;
      url: string;
      icons: string[];
    };
    features?: Features;
  }

  export function createAppKit(options: CreateAppKitOptions): AppKit;
}

declare module '@reown/appkit-adapter-solana' {
  import { Connection } from '@solana/web3.js';

  export interface SolanaAdapterOptions {
    mainnet: Connection;
    devnet: Connection;
  }

  export class SolanaAdapter {
    constructor(options: SolanaAdapterOptions);
  }
}
