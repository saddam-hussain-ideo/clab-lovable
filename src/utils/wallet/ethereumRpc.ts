
/**
 * Ethereum RPC utilities for managing connections and providers
 */
import { logDebug } from '@/utils/debugLogging';
import { supabase } from '@/integrations/supabase/client';

/**
 * Get the custom Ethereum RPC URL if configured
 * @param network The network type (mainnet or testnet)
 * @returns The custom RPC URL if available, or a default public one
 */
export const getCustomEthereumRpcUrl = async (
  network: 'mainnet' | 'testnet' = 'mainnet'
): Promise<string> => {
  try {
    // First try to get from localStorage for fastest access
    const localStorageKey = `ethereum_custom_rpc_url_${network}`;
    const localRpcUrl = localStorage.getItem(localStorageKey);
    
    if (localRpcUrl) {
      logDebug('ETH_RPC', `Using custom Ethereum RPC from localStorage: ${localRpcUrl.substring(0, 20)}...`);
      return localRpcUrl;
    }
    
    // Then try to get from database settings
    const { data, error } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', `ethereum_${network}_rpc_url`)
      .maybeSingle();
    
    if (error) {
      logDebug('ETH_RPC', `Error fetching custom Ethereum RPC URL: ${error.message}`);
      return getDefaultEthereumRpcUrl(network);
    }
    
    if (data?.value) {
      // Store in localStorage for faster access next time
      localStorage.setItem(localStorageKey, data.value);
      logDebug('ETH_RPC', `Using custom Ethereum RPC from database: ${data.value.substring(0, 20)}...`);
      return data.value;
    }
    
    return getDefaultEthereumRpcUrl(network);
  } catch (error) {
    logDebug('ETH_RPC', `Exception getting custom Ethereum RPC URL: ${error}`);
    return getDefaultEthereumRpcUrl(network);
  }
};

/**
 * Set a custom Ethereum RPC URL
 * @param rpcUrl The RPC URL to set
 * @param network The network type (mainnet or testnet)
 */
export const setCustomEthereumRpcUrl = (
  rpcUrl: string,
  network: 'mainnet' | 'testnet' = 'mainnet'
): void => {
  try {
    const localStorageKey = `ethereum_custom_rpc_url_${network}`;
    
    if (!rpcUrl) {
      // Clear the custom RPC URL
      localStorage.removeItem(localStorageKey);
      logDebug('ETH_RPC', `Cleared custom Ethereum RPC URL for ${network}`);
      return;
    }
    
    // Store in localStorage
    localStorage.setItem(localStorageKey, rpcUrl);
    logDebug('ETH_RPC', `Set custom Ethereum RPC URL for ${network}: ${rpcUrl.substring(0, 20)}...`);
  } catch (error) {
    logDebug('ETH_RPC', `Error setting custom Ethereum RPC URL: ${error}`);
  }
};

/**
 * Get the default Ethereum RPC URL for a network
 * @param network The network type (mainnet or testnet)
 * @returns A public RPC URL
 */
export const getDefaultEthereumRpcUrl = (
  network: 'mainnet' | 'testnet' = 'mainnet'
): string => {
  return network === 'mainnet'
    ? 'https://eth-mainnet.public.blastapi.io'
    : 'https://eth-sepolia.public.blastapi.io';
};

/**
 * Get the optimal Ethereum provider based on available options
 * @param network The network type (mainnet or testnet)
 * @returns An RPC URL to use
 */
export const getOptimalEthereumProvider = async (
  network: 'mainnet' | 'testnet' = 'mainnet'
): Promise<string> => {
  // Prefer custom RPC if available
  return await getCustomEthereumRpcUrl(network);
};

/**
 * Check an Ethereum RPC provider's health
 * @param rpcUrl The RPC URL to test
 * @returns Test result with success flag and latency
 */
export const testEthereumRpc = async (rpcUrl: string): Promise<{
  success: boolean;
  blockNumber?: string;
  latency: number;
  error?: string;
}> => {
  const startTime = performance.now();
  
  try {
    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: Date.now(),
        method: 'eth_blockNumber',
        params: [],
      }),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error.message || 'RPC error');
    }
    
    return {
      success: true,
      blockNumber: data.result,
      latency: performance.now() - startTime,
    };
  } catch (error) {
    return {
      success: false,
      latency: performance.now() - startTime,
      error: error instanceof Error ? error.message : String(error),
    };
  }
};

/**
 * Get the current ETH price from RPC provider
 * @returns Current ETH price in USD or 0 if error
 */
export const getEthPriceFromRpc = async (): Promise<number> => {
  try {
    const rpcUrl = await getOptimalEthereumProvider();
    
    // Create a simple eth_call to get the ETH price from a price feed contract
    // This is a simplified example and may need to be updated with a real price feed address
    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: Date.now(),
        method: 'eth_call',
        // Using Chainlink ETH/USD price feed on mainnet
        params: [
          {
            to: '0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419', // Chainlink ETH/USD Price Feed
            data: '0x50d25bcd' // latestAnswer() function signature
          },
          'latest'
        ],
      }),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error.message || 'RPC error');
    }
    
    // Parse the result - Chainlink returns price with 8 decimals
    if (data.result) {
      const hexPrice = data.result;
      const priceInt = parseInt(hexPrice, 16);
      const ethPrice = priceInt / 1e8;
      
      logDebug('ETH_PRICE', `Retrieved ETH price from RPC: $${ethPrice}`);
      return ethPrice;
    }
    
    throw new Error('No price data returned');
  } catch (error) {
    logDebug('ETH_PRICE', `Error getting ETH price from RPC: ${error}`);
    return 0;
  }
};

// If we're in a browser context, add the testEthereumRpc function to the window object
if (typeof window !== 'undefined') {
  (window as any).testEthereumRpc = testEthereumRpc;
}
