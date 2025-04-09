import { toast } from "sonner";
import { isMetamaskInstalled, getMetaMaskProvider } from "@/utils/wallet/metamask";
import { supabase } from "@/integrations/supabase/client";
import { 
  getCustomEthereumRpcUrl, 
  getOptimalEthereumProvider, 
  getEthPriceFromRpc,
  setCustomEthereumRpcUrl,
  testEthereumRpc
} from "@/utils/wallet/ethereumRpc";
import { logDebug } from '@/utils/debugLogging';
import { safelyAccessProperty } from "@/utils/wallet/safeAccess";

export { 
  getCustomEthereumRpcUrl, 
  getOptimalEthereumProvider, 
  setCustomEthereumRpcUrl,
  testEthereumRpc 
} from "@/utils/wallet/ethereumRpc";

const safeLocalStorage = {
  getItem: (key: string): string | null => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return localStorage.getItem(key);
      }
      return null;
    } catch (e) {
      console.warn('Failed to access localStorage:', e);
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(key, value);
      }
    } catch (e) {
      console.warn('Failed to write to localStorage:', e);
    }
  }
};

const TOKEN_ADDRESSES = {
  mainnet: {
    USDT: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    USDC: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
  },
  testnet: {
    USDT: '0x509Ee0d083DdF8AC028f2a56731412edD63223B9',
    USDC: '0x07865c6E87B9F70255377e024ace6630C1Eaa37F'
  }
};

const ERC20_ABI = [
  {
    constant: false,
    inputs: [
      { name: '_to', type: 'address' },
      { name: '_value', type: 'uint256' }
    ],
    name: 'transfer',
    outputs: [{ name: '', type: 'bool' }],
    type: 'function'
  },
  {
    constant: false,
    inputs: [
      { name: '_spender', type: 'address' },
      { name: '_value', type: 'uint256' }
    ],
    name: 'approve',
    outputs: [{ name: '', type: 'bool' }],
    type: 'function'
  },
  {
    constant: true,
    inputs: [
      { name: '_owner', type: 'address' },
      { name: '_spender', type: 'address' }
    ],
    name: 'allowance',
    outputs: [{ name: '', type: 'uint256' }],
    type: 'function'
  },
  {
    constant: true,
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', type: 'uint8' }],
    type: 'function'
  }
];

async function getTokenDecimals(tokenAddress: string, provider: any): Promise<number> {
  try {
    const decimalsCall = {
      to: tokenAddress,
      data: '0x313ce567'
    };
    
    const result = await provider.request({
      method: 'eth_call',
      params: [decimalsCall, 'latest']
    });
    
    const decimals = parseInt(result, 16);
    console.log(`Token ${tokenAddress} has ${decimals} decimals`);
    return decimals;
  } catch (error) {
    console.error("Error getting token decimals:", error);
    return 18;
  }
}

export const sendEthereumTransaction = async (
  amount: number,
  receiverAddress: string,
  currency: "ETH" | "USDC" | "USDT" = "ETH",
  walletType: string = 'metamask',
  network: 'mainnet' | 'testnet' = 'mainnet'
): Promise<string> => {
  console.log(`Initiating ${currency} transaction of ${amount} to ${receiverAddress} using ${walletType} on ${network}`);
  
  try {
    let provider;
    
    if (walletType === 'metamask') {
      if (!isMetamaskInstalled()) {
        throw new Error("MetaMask extension not detected. Please install MetaMask to continue.");
      }
      provider = getMetaMaskProvider();
      if (!provider) {
        throw new Error("MetaMask provider not available");
      }
    } else if (walletType === 'phantom_ethereum') {
      if (!window.phantom?.ethereum) {
        throw new Error("Phantom wallet with Ethereum support not detected");
      }
      provider = window.phantom.ethereum;
    } else {
      throw new Error(`Unsupported wallet type: ${walletType}`);
    }
    
    const accounts = await provider.request({ method: 'eth_accounts' });
    if (!accounts || accounts.length === 0) {
      throw new Error("No Ethereum accounts found. Please connect your wallet.");
    }
    
    const fromAddress = accounts[0];
    console.log(`Using address: ${fromAddress}`);
    
    let finalReceiverAddress = receiverAddress;
    
    try {
      const { data: paymentData, error: paymentError } = await supabase
        .from('payment_settings')
        .select('*')
        .single();
      
      if (paymentError) {
        console.error('Error fetching payment settings:', paymentError);
      } else if (paymentData) {
        if (network === 'mainnet') {
          if (currency === 'ETH') {
            finalReceiverAddress = paymentData.eth_address || receiverAddress;
          } else if (currency === 'USDC') {
            finalReceiverAddress = paymentData.usdc_address || receiverAddress;
          } else if (currency === 'USDT') {
            finalReceiverAddress = paymentData.usdt_address || receiverAddress;
          }
        } else { // testnet
          finalReceiverAddress = paymentData.test_eth_address || receiverAddress;
        }
        
        console.log(`Using ${currency} receiver address from settings: ${finalReceiverAddress}`);
      }
    } catch (error) {
      console.error('Error accessing payment settings:', error);
    }
    
    if (!finalReceiverAddress || !finalReceiverAddress.startsWith('0x')) {
      console.error('Invalid receiver address:', finalReceiverAddress);
      throw new Error(`Invalid receiver address for ${currency} on ${network}. Please contact support.`);
    }
    
    if (currency === "ETH") {
      const amountInWei = (Math.floor(amount * 10**18)).toString(16);
      
      const transactionParameters = {
        from: fromAddress,
        to: finalReceiverAddress,
        value: `0x${amountInWei}`,
        gas: '0x5208'
      };
      
      console.log("Sending ETH transaction with parameters:", transactionParameters);
      
      try {
        const txHash = await provider.request({
          method: 'eth_sendTransaction',
          params: [transactionParameters],
        });
        
        console.log("ETH transaction sent successfully:", txHash);
        return txHash;
      } catch (error: any) {
        console.error("Error in eth_sendTransaction:", error);
        
        if (walletType === 'phantom_ethereum') {
          if (error.code === 4001) {
            throw new Error("Transaction rejected by user");
          } else if (error.message && error.message.includes('Unexpected error')) {
            throw new Error("Phantom wallet encountered an unexpected error. Please try again or use MetaMask for better compatibility.");
          }
        }
        
        throw error;
      }
    } else if (currency === "USDC" || currency === "USDT") {
      const tokenAddresses = network === 'mainnet' ? TOKEN_ADDRESSES.mainnet : TOKEN_ADDRESSES.testnet;
      const tokenAddress = tokenAddresses[currency];
      
      if (!tokenAddress) {
        throw new Error(`Token address not configured for ${currency} on ${network}`);
      }
      
      const decimals = await getTokenDecimals(tokenAddress, provider);
      
      const tokenDecimals = decimals || (currency === 'USDT' || currency === 'USDC' ? 6 : 18);
      const tokenAmount = BigInt(Math.floor(amount * 10**tokenDecimals)).toString(16);
      
      console.log(`Sending ${amount} ${currency} (${tokenAmount} in hex) to ${finalReceiverAddress}`);
      
      const methodId = '0xa9059cbb';
      const paddedReceiver = finalReceiverAddress.slice(2).padStart(64, '0');
      const paddedAmount = tokenAmount.padStart(64, '0');
      
      const data = `${methodId}${paddedReceiver}${paddedAmount}`;
      
      const tokenTransactionParameters = {
        from: fromAddress,
        to: tokenAddress,
        data: `0x${data}`,
        gas: walletType === 'phantom_ethereum' ? '0x249F0' : '0x186a0'
      };
      
      console.log("Sending token transaction with parameters:", tokenTransactionParameters);
      
      try {
        const txHash = await provider.request({
          method: 'eth_sendTransaction',
          params: [tokenTransactionParameters],
        });
        
        console.log(`${currency} transaction sent successfully:`, txHash);
        return txHash;
      } catch (error: any) {
        console.error(`Error in ${currency} transaction:`, error);
        
        if (walletType === 'phantom_ethereum') {
          if (error.code === 4001) {
            throw new Error("Transaction rejected by user");
          } else if (error.message && error.message.includes('Unexpected error')) {
            throw new Error("Phantom wallet encountered an unexpected error. Please try MetaMask for better compatibility with ERC-20 tokens.");
          }
        }
        
        throw error;
      }
    } else {
      throw new Error(`Unsupported currency: ${currency}`);
    }
  } catch (error: any) {
    console.error("Error sending Ethereum transaction:", error);
    
    if (error.code === 4001) {
      throw new Error("Transaction rejected by user");
    }
    
    throw new Error(error.message || "Failed to send transaction");
  }
};

export const syncEthereumPrice = async (): Promise<boolean> => {
  try {
    console.log('Syncing Ethereum price before purchase...');
    
    const liveEthPrice = window.ethereumPrice || localStorage.getItem('ethereum_price');
    if (liveEthPrice) {
      const ethPrice = parseFloat(String(liveEthPrice));
      if (!isNaN(ethPrice) && ethPrice > 0) {
        console.log(`Using cached/live ETH price: $${ethPrice}`);
        
        const apiHeaders = {
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        };
        
        const { data, error } = await supabase.functions.invoke('update-eth-price', {
          method: 'POST',
          headers: apiHeaders,
          body: {
            network: localStorage.getItem('activeNetwork') || 'mainnet',
            manualPrice: ethPrice
          }
        });
        
        if (error) {
          console.error('Error syncing ETH price with manual value:', error);
          return true;
        } else {
          console.log('Successfully synced ETH price to database:', data);
        }
        
        try {
          const { error: updateError } = await supabase
            .from('presale_settings')
            .update({ eth_price: ethPrice })
            .eq('id', localStorage.getItem('activeNetwork') === 'mainnet' ? 'default' : 'testnet');
          
          if (updateError) {
            console.error('Error updating ETH price in settings:', updateError);
          } else {
            console.log(`Updated presale_settings.eth_price to $${ethPrice}`);
          }
        } catch (settingsError) {
          console.error('Exception updating ETH price in settings:', settingsError);
        }
        
        return true;
      }
    }
    
    try {
      const rpcPrice = await getEthPriceFromRpc();
      if (rpcPrice > 0) {
        window.ethereumPrice = rpcPrice;
        localStorage.setItem('ethereum_price', rpcPrice.toString());
        console.log(`Updated local ETH price from RPC: $${rpcPrice}`);
        
        try {
          const { error: updateError } = await supabase
            .from('presale_settings')
            .update({ eth_price: rpcPrice })
            .eq('id', localStorage.getItem('activeNetwork') === 'mainnet' ? 'default' : 'testnet');
          
          if (updateError) {
            console.error('Error updating ETH price in settings:', updateError);
          } else {
            console.log(`Updated presale_settings.eth_price to $${rpcPrice}`);
          }
        } catch (settingsError) {
          console.error('Exception updating ETH price in settings:', settingsError);
        }
        
        return true;
      }
    } catch (rpcError) {
      console.warn('Failed to get ETH price from RPC:', rpcError);
    }
    
    const { data, error } = await supabase.functions.invoke('update-eth-price', {
      method: 'POST',
      body: {
        network: localStorage.getItem('activeNetwork') || 'mainnet'
      }
    });
    
    if (error) {
      console.error('Error syncing ETH price:', error);
      return false;
    }
    
    console.log('ETH price sync response:', data);
    
    if (data.success === true && data.price) {
      window.ethereumPrice = data.price;
      localStorage.setItem('ethereum_price', data.price.toString());
      console.log(`Updated local ETH price to: $${data.price}`);
      
      try {
        const { error: updateError } = await supabase
          .from('presale_settings')
          .update({ eth_price: data.price })
          .eq('id', localStorage.getItem('activeNetwork') === 'mainnet' ? 'default' : 'testnet');
        
        if (updateError) {
          console.error('Error updating ETH price in settings:', updateError);
        } else {
          console.log(`Updated presale_settings.eth_price to $${data.price}`);
        }
      } catch (settingsError) {
        console.error('Exception updating ETH price in settings:', settingsError);
      }
    }
    
    return data.success === true;
  } catch (err) {
    console.error('Exception syncing ETH price:', err);
    return false;
  }
};

export const testCoinGeckoAPIKey = async (apiKeyToTest?: string): Promise<{ success: boolean; message: string }> => {
  try {
    console.log('Testing CoinGecko API key...');
    
    let apiKey = apiKeyToTest;
    if (!apiKey) {
      console.log('No API key provided, retrieving from database...');
      const { data: apiKeyData, error: keyError } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'coingecko_api_key')
        .maybeSingle();
      
      if (keyError) {
        console.error('Error retrieving API key from settings:', keyError);
        return { 
          success: false, 
          message: 'Error retrieving API key from database: ' + keyError.message 
        };
      }
      
      if (!apiKeyData?.value) {
        console.log('No API key found in settings');
        return { 
          success: false, 
          message: 'No API key found in settings. Please add an API key and try again.' 
        };
      }
      
      apiKey = apiKeyData.value;
    }
    
    console.log('Found API key, sending test request...');
    
    const { data, error } = await supabase.functions.invoke('update-eth-price', {
      method: 'POST',
      body: { 
        test: true,
        testApiKey: apiKey,
        skipAuth: true
      }
    });
    
    if (error) {
      console.error('Error testing API key:', error);
      if (error.message?.includes('429') || error.message?.includes('rate limit') || error.message?.includes('too many requests')) {
        return {
          success: false,
          message: 'CoinGecko rate limit reached. Please wait a minute before trying again. The API limits requests to 10-30 per minute depending on your plan.'
        };
      }
      
      return { 
        success: false, 
        message: `Edge function error: ${error.message}` 
      };
    }
    
    console.log('API test response:', data);
    
    if (!data) {
      return { 
        success: false, 
        message: 'No response from API test' 
      };
    }
    
    if (data.rateLimited) {
      return {
        success: false,
        message: data.message || 'Rate limit reached. Please wait before testing again.'
      };
    }
    
    return {
      success: data.success,
      message: data.message || (data.success ? 'API key is valid' : 'API key test failed')
    };
  } catch (error) {
    console.error('Error testing CoinGecko API key:', error);
    return {
      success: false,
      message: `Error: ${error instanceof Error ? error.message : String(error)}`
    };
  }
};

export const getEthereumRpcInfo = async (network: 'mainnet' | 'testnet' = 'mainnet'): Promise<{
  url: string;
  isCustom: boolean;
  isAlchemy: boolean;
}> => {
  try {
    const { getCustomEthereumRpcUrl } = await import('@/utils/wallet/ethereumRpc');
    const rpcUrl = await getCustomEthereumRpcUrl(network);
    
    return {
      url: rpcUrl,
      isCustom: true,
      isAlchemy: rpcUrl.includes('alchemy.com')
    };
  } catch (error) {
    console.error('Error getting Ethereum RPC info:', error);
    return {
      url: network === 'mainnet' ? 'https://eth-mainnet.public.blastapi.io' : 'https://eth-sepolia.public.blastapi.io',
      isCustom: false,
      isAlchemy: false
    };
  }
};

export { getEthPrice } from '@/utils/tokenCalculation';

const createFetchRpcProvider = (rpcUrl: string) => {
  return {
    async request({ method, params = [] }: { method: string; params?: any[] }) {
      const response = await fetch(rpcUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: Date.now(),
          method,
          params,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error.message || 'RPC error');
      }
      
      return data.result;
    },
  };
};

if (typeof window !== 'undefined') {
  (window as any).testCoinGeckoAPIKey = testCoinGeckoAPIKey;
  (window as any).testEthereumRpc = testEthereumRpc;
}
