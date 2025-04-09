
/**
 * Utility functions for token calculations
 */
import { logDebug } from './debugLogging';
import { supabase } from "@/integrations/supabase/client";
import { getEthPriceFromRpc } from '@/utils/wallet/ethereumRpc';

/**
 * Calculate token amount for Ethereum network purchases
 * @param amount The amount of cryptocurrency being used to purchase
 * @param currency The cryptocurrency being used (ETH, USDC, USDT)
 * @param tokenPriceUsd The price of one token in USD
 * @param ethUsdRate The current ETH to USD exchange rate
 * @param debugContext Optional context for logging
 * @returns The calculated token amount
 */
export const calculateEthNetworkTokenAmount = (
  amount: number,
  currency: 'ETH' | 'USDC' | 'USDT',
  tokenPriceUsd: number,
  ethUsdRate: number = 3000,
  debugContext?: string
): number => {
  if (tokenPriceUsd <= 0) {
    logDebug(debugContext || 'calculateEthNetworkTokenAmount', `Token price is invalid: ${tokenPriceUsd}`);
    return 0;
  }

  let amountInUsd = 0;

  // Calculate USD value based on currency
  if (currency === 'ETH') {
    amountInUsd = amount * ethUsdRate;
    logDebug(debugContext || 'calculateEthNetworkTokenAmount', `Converting ${amount} ETH to USD: $${amountInUsd} at rate $${ethUsdRate}`);
  } else {
    // For USDC and USDT, assuming 1:1 with USD
    amountInUsd = amount;
    logDebug(debugContext || 'calculateEthNetworkTokenAmount', `Using fixed 1:1 USD value for ${currency}: $${amountInUsd}`);
  }

  // Calculate token amount
  const tokenAmount = amountInUsd / tokenPriceUsd;
  
  logDebug(debugContext || 'calculateEthNetworkTokenAmount', 
    `Calculation result: ${amount} ${currency} = $${amountInUsd} = ${tokenAmount} tokens at $${tokenPriceUsd} per token`
  );
  
  return tokenAmount;
};

/**
 * Get the current ETH price from real-time data, settings, or use a fallback
 * Prioritizes real-time market data if available
 * @returns Current ETH price or fallback value
 */
export const getEthPrice = async (): Promise<number> => {
  try {
    // First try to get price from window event/global state (set by useCryptoPrices hook)
    const globalEthPrice = window.ethereumPrice || localStorage.getItem('ethereum_price');
    if (globalEthPrice) {
      const ethPrice = parseFloat(String(globalEthPrice));
      if (!isNaN(ethPrice) && ethPrice > 0) {
        logDebug('getEthPrice', `Using real-time ETH price: $${ethPrice}`);
        return ethPrice;
      }
    }
    
    // Try to get ETH price directly from our RPC provider
    try {
      const rpcPrice = await getEthPriceFromRpc();
      if (rpcPrice > 0) {
        // Cache the price
        window.ethereumPrice = rpcPrice;
        localStorage.setItem('ethereum_price', rpcPrice.toString());
        logDebug('getEthPrice', `Fetched ETH price from RPC: $${rpcPrice}`);
        return rpcPrice;
      }
    } catch (rpcError) {
      logDebug('getEthPrice', `Failed to get ETH price from RPC: ${rpcError}`);
      // Continue to fallback methods
    }
    
    // If real-time price is not available, try to fetch it from the edge function
    try {
      // Try to get API key for CoinGecko
      const { data: keyData } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'coingecko_api_key')
        .maybeSingle();
        
      const apiKey = keyData?.value;
      
      if (apiKey) {
        // Use the Edge Function to get the price to avoid exposing the API key
        const { data, error } = await supabase.functions.invoke('get-crypto-prices', {
          method: 'POST',
          body: { 
            cryptoIds: ['ethereum'],
            useMock: false
          }
        });
        
        if (!error && data?.prices?.ethereum?.current_price) {
          const fetchedPrice = data.prices.ethereum.current_price;
          logDebug('getEthPrice', `Fetched ETH price from edge function: $${fetchedPrice}`);
          
          // Store it for future use
          if (typeof window !== 'undefined') {
            window.ethereumPrice = fetchedPrice;
            localStorage.setItem('ethereum_price', fetchedPrice.toString());
          }
          
          return fetchedPrice;
        }
      }
    } catch (fetchError) {
      logDebug('getEthPrice', `Failed to fetch price directly: ${fetchError}`);
      // Continue to next fallback
    }
    
    // Try to get ETH price from presale settings as fallback
    const { data, error } = await supabase
      .from('presale_settings')
      .select('eth_price')
      .eq('id', localStorage.getItem('activeNetwork') === 'mainnet' ? 'default' : 'testnet')
      .single();
      
    if (error) {
      logDebug('getEthPrice', `Error fetching ETH price from settings: ${error.message}`);
      return 1997; // Fallback price updated to current market value
    }
    
    if (data && data.eth_price && data.eth_price > 0) {
      logDebug('getEthPrice', `Using ETH price from settings: $${data.eth_price}`);
      return data.eth_price;
    }
    
    // Fallback to default price if not found or invalid
    logDebug('getEthPrice', 'No valid ETH price in settings, using default');
    return 1997; // Updated fallback price
  } catch (error) {
    logDebug('getEthPrice', `Exception getting ETH price: ${error}`);
    return 1997; // Updated fallback price on error
  }
};

/**
 * Store token amount and related data in the database
 * @param walletAddress The wallet address of the user
 * @param tokenAmount The amount of tokens
 * @param originalAmount The original purchase amount (optional)
 * @returns ID of the stored record or null if operation failed
 */
export const storeTokenAmountInDB = async (
  walletAddress: string, 
  tokenAmount: number, 
  originalAmount?: number
): Promise<string | null> => {
  try {
    logDebug('storeTokenAmountInDB', `Storing token data for ${walletAddress}: ${tokenAmount} tokens`);
    
    // Check if the token_tracking table exists first
    const { error: tableCheckError } = await supabase.rpc(
      'check_policy_exists',
      { table_name: 'token_tracking', policy_name: 'token_tracking_insert' }
    );
    
    // If the table might not exist, just log the data locally and don't fail
    if (tableCheckError) {
      console.log('Token tracking table may not exist, storing data locally:', {
        wallet_address: walletAddress,
        token_amount: tokenAmount,
        original_amount: originalAmount || 0
      });
      return null;
    }
    
    // Try to insert into the token_tracking table
    try {
      // Use raw SQL query with from.insert() to avoid type errors
      // This approach allows us to work with tables that might not be in the TypeScript types
      const result = await supabase
        .from('token_tracking' as any)
        .insert({
          wallet_address: walletAddress,
          token_amount: tokenAmount,
          original_amount: originalAmount || 0,
          timestamp: new Date().toISOString()
        })
        .select('id')
        .single();
      
      if (result.error) {
        logDebug('storeTokenAmountInDB', `Error storing token data: ${result.error.message}`);
        return null;
      }
      
      // Proper type assertion with unknown as intermediate step
      const data = (result.data as unknown) as { id: string };
      logDebug('storeTokenAmountInDB', `Successfully stored token data with ID: ${data?.id}`);
      return data?.id || null;
    } catch (insertError) {
      // If there's an error with the insert, it's likely because the table doesn't exist
      console.log('Token data (not stored in DB):', {
        wallet_address: walletAddress,
        token_amount: tokenAmount,
        original_amount: originalAmount || 0
      });
      return null;
    }
  } catch (error) {
    logDebug('storeTokenAmountInDB', `Exception storing token data: ${error}`);
    return null;
  }
};

/**
 * Helper function to ensure token amounts are consistent
 * Used for validation and debugging
 */
export const ensureConsistentTokenAmount = (amount: number, context?: string): number => {
  if (!amount || isNaN(amount) || amount <= 0) {
    logDebug(context || 'ensureConsistentTokenAmount', `Invalid token amount detected: ${amount}`);
    return 0;
  }
  
  // Add any additional validation logic here if needed
  
  return amount;
};

/**
 * Dump token storage values for debugging
 */
export const dumpTokenStorage = (): Record<string, string> => {
  try {
    const storage: Record<string, string> = {};
    
    // Get token-related localStorage values
    if (typeof window !== 'undefined') {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('token') || key.includes('Token') || key.includes('amount') || key.includes('Amount'))) {
          storage[key] = localStorage.getItem(key) || '';
        }
      }
    }
    
    logDebug('dumpTokenStorage', `Retrieved ${Object.keys(storage).length} token-related storage items`);
    return storage;
  } catch (error) {
    logDebug('dumpTokenStorage', `Error dumping token storage: ${error}`);
    return {};
  }
};
