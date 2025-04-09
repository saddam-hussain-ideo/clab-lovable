
import { Connection, clusterApiUrl, PublicKey } from '@solana/web3.js';
import { logDebug, logCriticalTokenIssue } from "@/utils/debugLogging";

/**
 * Utility functions for interacting with the Solana blockchain for presale purposes
 */

// Default RPC endpoint (can be overridden with custom endpoint)
const DEFAULT_RPC_ENDPOINT = clusterApiUrl('devnet');

/**
 * Get an optimal Solana connection based on network and custom RPC settings
 * @returns Solana connection object
 */
export const getOptimalConnection = (): Connection => {
  try {
    const network = localStorage.getItem('activeNetwork') === 'mainnet' ? 'mainnet-beta' : 'devnet';
    
    // First priority: Check for Alchemy API key
    const alchemyApiKey = localStorage.getItem('alchemyApiKey');
    let rpcEndpoint = DEFAULT_RPC_ENDPOINT;
    
    if (alchemyApiKey) {
      rpcEndpoint = network === 'mainnet-beta'
        ? `https://solana-mainnet.g.alchemy.com/v2/${alchemyApiKey}`
        : `https://solana-devnet.g.alchemy.com/v2/${alchemyApiKey}`;
        
      logDebug('RPC_CONNECTION', `Using Alchemy RPC endpoint for ${network}`);
    } 
    // Second priority: Check for custom RPC URL
    else {
      const customRpcUrl = localStorage.getItem('customSolanaRpcUrl');
      if (customRpcUrl && customRpcUrl.startsWith('http')) {
        rpcEndpoint = customRpcUrl;
        logDebug('RPC_CONNECTION', `Using custom RPC endpoint: ${rpcEndpoint}`);
      } else {
        // Fallback to default endpoint
        rpcEndpoint = network === 'mainnet-beta' 
          ? clusterApiUrl('mainnet-beta') 
          : clusterApiUrl('devnet');
        logDebug('RPC_CONNECTION', `Using default RPC endpoint for ${network}: ${rpcEndpoint}`);
      }
    }
    
    console.log(`Creating Solana connection with RPC endpoint: ${rpcEndpoint}`);
    const connection = new Connection(rpcEndpoint, 'confirmed');
    
    // Log connection details
    logDebug('RPC_CONNECTION', `Connection to Solana established with endpoint: ${rpcEndpoint}`);
    
    return connection;
  } catch (error) {
    console.error("Error getting optimal Solana connection:", error);
    logCriticalTokenIssue('RPC_CONNECTION', `Error getting optimal Solana connection: ${error}`);
    return new Connection(DEFAULT_RPC_ENDPOINT, 'confirmed');
  }
};

/**
 * Get the current slot height from the Solana blockchain
 * @returns Current slot height
 */
export const getCurrentSlot = async (): Promise<number> => {
  try {
    const connection = getOptimalConnection();
    const slot = await connection.getSlot();
    logDebug('RPC_USAGE', `Current slot height: ${slot}`);
    return slot;
  } catch (error) {
    console.error("Error getting current slot:", error);
    logDebug('RPC_USAGE', `Error getting current slot: ${error}`);
    return 0;
  }
};

/**
 * Get the balance of a Solana account
 * @param accountAddress The address of the account to check
 * @returns The balance of the account in SOL
 */
export const getAccountBalance = async (accountAddress: string): Promise<number> => {
  try {
    const connection = getOptimalConnection();
    const balance = await connection.getBalance(new PublicKey(accountAddress));
    const solBalance = balance / 1000000000; // lamports to SOL
    logDebug('RPC_USAGE', `Account ${accountAddress} balance: ${solBalance} SOL`);
    return solBalance;
  } catch (error) {
    console.error("Error getting account balance:", error);
    logDebug('RPC_USAGE', `Error getting account balance for ${accountAddress}: ${error}`);
    return 0;
  }
};

/**
 * Get multiple account balances in a single RPC call
 * @param accountAddresses Array of account addresses to fetch balances for
 * @returns Array of account balances in SOL
 */
export const getMultipleAccountBalances = async (accountAddresses: string[]): Promise<number[]> => {
  try {
    const connection = getOptimalConnection();
    const publicKeys = accountAddresses.map(address => new PublicKey(address));
    
    // Fetch multiple account info
    const accountInfos = await connection.getMultipleAccountsInfo(publicKeys);
    
    // Extract balances and convert to SOL
    const balances = accountInfos.map(accountInfo => {
      if (accountInfo) {
        return accountInfo.lamports / 1000000000; // lamports to SOL
      } else {
        return 0; // Account not found
      }
    });
    
    logDebug('RPC_USAGE', `Fetched balances for ${accountAddresses.length} accounts`);
    return balances;
  } catch (error) {
    console.error("Error getting multiple account balances:", error);
    logDebug('RPC_USAGE', `Error getting multiple account balances: ${error}`);
    return [];
  }
};
