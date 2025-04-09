import { clusterApiUrl, Connection } from '@solana/web3.js';
import { withRetry } from '@/utils/retry/retryUtils';

// RPC URL rotation to handle rate limits
const rpcEndpoints = {
  'mainnet-beta': [
    'https://api.mainnet-beta.solana.com',
    'https://solana-api.projectserum.com',
    'https://rpc.ankr.com/solana',
    'https://ssc-dao.genesysgo.net'
  ],
  'devnet': [
    'https://api.devnet.solana.com',
    'https://solana-devnet.g.alchemy.com/v2/demo'
  ]
};

// Track failed RPC endpoints to avoid repeatedly using them
const failedRpcEndpoints: Record<string, number> = {};
const RPC_RETRY_DELAY = 60000; // 1 minute cooldown for failed endpoints

export const setCustomRpcUrl = (url: string) => {
  if (!url) {
    localStorage.removeItem('customSolanaRpcUrl');
    return;
  }
  
  console.log(`Setting custom Solana RPC URL: ${url.substring(0, 30)}...`);
  localStorage.setItem('customSolanaRpcUrl', url);
};

export const setAlchemyApiKey = (apiKey: string) => {
  if (!apiKey) {
    localStorage.removeItem('alchemyApiKey');
    return;
  }
  
  console.log(`Setting Alchemy API key: ${apiKey.substring(0, 6)}...`);
  localStorage.setItem('alchemyApiKey', apiKey);
};

// Enhanced getCustomRpcUrl with fallback and rotation - Always prioritize mainnet
export const getCustomRpcUrl = (network: string = 'mainnet-beta') => {
  // Always use mainnet for production
  const useNetwork = 'mainnet-beta';
  
  // First try custom configured RPC
  const customRpcUrl = localStorage.getItem('customSolanaRpcUrl');
  const alchemyApiKey = localStorage.getItem('alchemyApiKey');
  
  if (customRpcUrl && customRpcUrl.startsWith('http')) {
    console.log(`Using primary custom RPC URL: ${customRpcUrl.substring(0, 30)}...`);
    return customRpcUrl;
  } else if (alchemyApiKey) {
    // Always use mainnet Alchemy URL
    const alchemyUrl = `https://solana-mainnet.g.alchemy.com/v2/${alchemyApiKey}`;
      
    console.log(`Using Alchemy RPC URL for mainnet`);
    return alchemyUrl;
  }
  
  console.log(`No custom RPC URL configured, returning null`);
  return null;
};

// Get an RPC endpoint with automatic fallback on rate limit errors - Always use mainnet
export const getFallbackRpcUrl = (network: string = 'mainnet-beta', skipFailed = true): string => {
  // Always use mainnet for production
  const useNetwork = 'mainnet-beta';
  
  const now = Date.now();
  const validEndpoints = (rpcEndpoints[useNetwork] || [])
    .filter(endpoint => {
      // Filter out recently failed endpoints
      if (skipFailed && failedRpcEndpoints[endpoint] && (now - failedRpcEndpoints[endpoint]) < RPC_RETRY_DELAY) {
        console.log(`Skipping recently failed endpoint: ${endpoint}`);
        return false;
      }
      return true;
    });
  
  if (validEndpoints.length === 0) {
    // If all endpoints failed recently, use any endpoint
    console.log('All RPC endpoints failed recently, trying any available endpoint');
    const anyEndpoint = (rpcEndpoints[useNetwork] || [])[0];
    return anyEndpoint || 'https://api.mainnet-beta.solana.com';
  }
  
  // Select a random endpoint to distribute load
  const randomIndex = Math.floor(Math.random() * validEndpoints.length);
  const endpoint = validEndpoints[randomIndex];
  console.log(`Using fallback RPC endpoint: ${endpoint}`);
  return endpoint;
};

// Mark an RPC endpoint as failed (e.g. on rate limit)
export const markRpcEndpointFailed = (endpoint: string) => {
  failedRpcEndpoints[endpoint] = Date.now();
  console.log(`Marked RPC endpoint as failed: ${endpoint}`);
};

// Utility function to get connection with rate limit handling
export const getSolanaConnection = async (network: string = 'mainnet-beta') => {
  // Always use mainnet for production
  const useNetwork = 'mainnet-beta';
  
  return withRetry(async () => {
    try {
      // Try custom RPC first
      const customRpcUrl = getCustomRpcUrl(useNetwork);
      if (customRpcUrl) {
        return new Connection(customRpcUrl, 'confirmed');
      }
      
      // Fall back to a random endpoint from our pool
      const fallbackUrl = getFallbackRpcUrl(useNetwork);
      return new Connection(fallbackUrl, 'confirmed');
    } catch (error) {
      console.error('Error creating Solana connection:', error);
      throw error;
    }
  }, { context: `Solana Connection (${useNetwork})` });
};

// Enhanced blockhash cache to reduce RPC calls
const blockhashCache: Record<string, { 
  hash: string; 
  timestamp: number;
  lastValidBlockHeight?: number;
  source: string;
}> = {};

// Longer blockhash cache interval - blockchains commit roughly every 400ms
// so 30 seconds is still very safe (but helps avoid rate limits)
const BLOCKHASH_CACHE_INTERVAL = 30000; // 30 seconds

// Also keep a global emergency blockhash that can be used as a last resort
let emergencyBlockhash: string | null = null;
let lastEmergencyBlockhashUpdate = 0;
const EMERGENCY_BLOCKHASH_UPDATE_INTERVAL = 120000; // 2 minutes

export const getFreshBlockhash = async (network: string = 'mainnet-beta'): Promise<string> => {
  // Always use mainnet for production
  const useNetwork = 'mainnet-beta';
  
  console.log(`Getting fresh blockhash for network: ${useNetwork}`);
  
  const cacheKey = useNetwork;
  const now = Date.now();
  
  // First, update our emergency blockhash periodically
  if (!emergencyBlockhash || (now - lastEmergencyBlockhashUpdate) > EMERGENCY_BLOCKHASH_UPDATE_INTERVAL) {
    try {
      // Try to get a fresh blockhash from any available RPC for emergency use
      const backupEndpoints = rpcEndpoints[useNetwork] || [];
      for (const url of backupEndpoints) {
        try {
          const connection = new Connection(url, 'confirmed');
          const { blockhash } = await connection.getLatestBlockhash('confirmed');
          emergencyBlockhash = blockhash;
          lastEmergencyBlockhashUpdate = now;
          console.log(`Updated emergency blockhash: ${blockhash} from ${url}`);
          break;
        } catch (e) {
          // Silently continue to next URL
        }
      }
    } catch (e) {
      // Silently fail, we'll try again later
    }
  }
  
  // Return cached blockhash if within cache interval
  if (blockhashCache[cacheKey] && (now - blockhashCache[cacheKey].timestamp) < BLOCKHASH_CACHE_INTERVAL) {
    console.log(`Using cached blockhash for ${useNetwork} (age: ${(now - blockhashCache[cacheKey].timestamp)/1000}s) from ${blockhashCache[cacheKey].source}`);
    return blockhashCache[cacheKey].hash;
  }
  
  return withRetry(async () => {
    // First, try using a custom RPC if configured
    const customRpcUrl = getCustomRpcUrl(useNetwork);
    
    if (customRpcUrl) {
      try {
        console.log(`Fetching blockhash from custom RPC: ${customRpcUrl.substring(0, 30)}...`);
        const connection = new Connection(customRpcUrl, 'confirmed');
        const { blockhash } = await connection.getLatestBlockhash('confirmed');
        
        console.log(`Got fresh blockhash from custom RPC: ${blockhash}`);
        
        // Store in cache
        blockhashCache[cacheKey] = {
          hash: blockhash,
          timestamp: now,
          source: 'custom-rpc'
        };
        
        return blockhash;
      } catch (error) {
        console.error("Error fetching blockhash from custom RPC:", error);
        throw error; // Let retry mechanism handle it
      }
    }
    
    // Try to get blockhash from edge function if available
    try {
      const origin = window.location.origin;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      const response = await fetch(
        `${origin}/functions/v1/get-solana-rpc?method=getLatestBlockhash&network=mainnet-beta`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          cache: 'no-cache',
          signal: controller.signal
        }
      );
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.latest_blockhash) {
        console.log("Successfully got blockhash from edge function:", data.latest_blockhash);
        
        // Update cache
        blockhashCache[cacheKey] = {
          hash: data.latest_blockhash,
          timestamp: now,
          source: 'edge-function'
        };
        
        return data.latest_blockhash;
      }
      
      throw new Error("Edge function did not return a blockhash");
    } catch (error) {
      console.error("Error getting blockhash from edge function:", error);
      throw error; // Let retry mechanism handle it
    }
  }, { context: `Blockhash (${useNetwork})`, maxRetries: 7 }); // Higher retry count for blockhash
};
