
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.32.0'
import { corsHeaders, handleCors } from '../_shared/cors.ts'

// Global variable to track last API request time to implement rate limiting
const apiRequestTracker = {
  lastRequestTime: 0,
  minIntervalMs: 10000 // 10 seconds between requests
};

// Get ETH price from CoinGecko
async function fetchEthPrice(apiKeyOverride = null) {
  try {
    console.log('Fetching ETH price from CoinGecko...')
    
    // Use provided API key or try to get from secrets
    const apiKey = apiKeyOverride || Deno.env.get('COINGECKO_API_KEY')
    
    // Log if we found an API key (without revealing the key itself)
    if (apiKey) {
      console.log('Using CoinGecko API key: ' + apiKey.substring(0, 4) + '***')
    } else {
      console.log('No CoinGecko API key found')
    }
    
    // Set the base API URL based on whether we have an API key
    const baseUrl = apiKey 
      ? 'https://pro-api.coingecko.com/api/v3' 
      : 'https://api.coingecko.com/api/v3';
    
    // Construct the URL (without the API key in the URL parameters)
    const url = `${baseUrl}/simple/price?ids=ethereum&vs_currencies=usd`;
    
    console.log(`Requesting from URL: ${url}`);
    
    // Set up headers properly
    const headers: Record<string, string> = {};
    
    // Only add the API key to headers when available
    if (apiKey) {
      headers['x-cg-pro-api-key'] = apiKey;
      console.log('Using CoinGecko Pro API with API key in headers');
    }
    
    const response = await fetch(url, { 
      headers,
      // Add timeout to prevent hanging requests
      signal: AbortSignal.timeout(10000)
    });
    
    console.log(`CoinGecko API response status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Could not read error response');
      console.error(`CoinGecko API error response: ${errorText}`);
      
      // Special handling for rate limiting
      if (response.status === 429) {
        return { 
          success: false, 
          price: null,
          message: 'Rate limit exceeded. CoinGecko limits requests to 10-30 calls per minute depending on your plan.',
          rateLimited: true
        };
      }
      
      throw new Error(`CoinGecko API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('CoinGecko API response data:', data);
    
    if (data?.ethereum?.usd) {
      return { 
        success: true, 
        price: data.ethereum.usd,
        message: 'Successfully fetched ETH price' 
      };
    } else {
      throw new Error('Invalid response format from CoinGecko');
    }
  } catch (error) {
    console.error('Error fetching ETH price:', error);
    return { 
      success: false, 
      message: `Error fetching ETH price: ${error instanceof Error ? error.message : String(error)}`,
      price: null
    };
  }
}

// Test the API key by making a simple request to the coins/list endpoint
async function testApiKey(apiKey: string) {
  if (!apiKey) {
    return { success: false, message: 'No API key provided for testing' };
  }
  
  console.log(`Testing CoinGecko API key: ${apiKey.substring(0, 4)}***`);
  
  // Check if we're making requests too frequently
  const now = Date.now();
  const timeSinceLastRequest = now - apiRequestTracker.lastRequestTime;
  
  if (timeSinceLastRequest < apiRequestTracker.minIntervalMs) {
    console.log(`Rate limiting locally: ${apiRequestTracker.minIntervalMs - timeSinceLastRequest}ms before next request`);
    return { 
      success: false, 
      message: `Please wait ${Math.ceil((apiRequestTracker.minIntervalMs - timeSinceLastRequest) / 1000)} seconds before testing again. CoinGecko has strict rate limits.`,
      rateLimited: true
    };
  }
  
  // Update last request time
  apiRequestTracker.lastRequestTime = now;
  
  try {
    // First test - Try a simple ping to verify the key is valid
    const pingUrl = 'https://pro-api.coingecko.com/api/v3/ping';
    
    console.log(`Testing API key with ping request to: ${pingUrl}`);
    
    const pingResponse = await fetch(pingUrl, {
      method: 'GET',
      headers: {
        'x-cg-pro-api-key': apiKey,
        'Content-Type': 'application/json'
      },
      signal: AbortSignal.timeout(10000)
    });
    
    console.log(`CoinGecko API ping test response status: ${pingResponse.status}`);
    
    if (!pingResponse.ok) {
      const errorText = await pingResponse.text().catch(() => 'Unknown error');
      console.error(`CoinGecko API key ping test failed (${pingResponse.status}): ${errorText}`);
      
      // Specific handling for rate limiting
      if (pingResponse.status === 429) {
        return { 
          success: false, 
          message: 'Rate limit exceeded. Please wait a minute before testing again. CoinGecko limits API requests to 10-30 per minute depending on your plan.',
          rateLimited: true
        };
      }
      
      // Distinguish between unauthorized (invalid key) and other errors
      if (pingResponse.status === 401) {
        return { 
          success: false, 
          message: 'Invalid API key: Authentication failed (status 401)' 
        };
      } else {
        return { 
          success: false, 
          message: `API key test failed: ${pingResponse.status} ${pingResponse.statusText}`,
          details: errorText
        };
      }
    }
    
    // Second test - Try to fetch price data
    const fetchResult = await fetchEthPrice(apiKey);
    
    if (fetchResult.success) {
      return { 
        success: true, 
        message: `API key is valid and successfully fetched ETH price: $${fetchResult.price}`
      };
    } else if (fetchResult.rateLimited) {
      return fetchResult; // Pass through the rate limiting message
    } else {
      return {
        success: false,
        message: `API key appears valid but couldn't fetch price data: ${fetchResult.message}`
      };
    }
  } catch (error) {
    console.error('Error testing CoinGecko API key:', error);
    return { 
      success: false, 
      message: `Connection error: ${error instanceof Error ? error.message : String(error)}` 
    };
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  const corsResponse = handleCors(req);
  if (corsResponse) {
    return corsResponse;
  }
  
  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ 
        error: 'Method not allowed',
        message: `Expected POST, got ${req.method}`
      }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    
    // Get parameters from request if any
    let params = {}
    try {
      params = await req.json()
    } catch (error) {
      console.error('Error parsing request body:', error);
      // If no JSON body or invalid JSON, use empty params
      params = {}
    }
    
    console.log('Request parameters:', params);
    
    // Check if this is an API key test request
    if (params.test === true) {
      console.log('Processing API key test request');
      
      // If testApiKey is provided, use that for testing
      // Otherwise, use the one from environment
      const apiKeyToTest = params.testApiKey || Deno.env.get('COINGECKO_API_KEY');
      
      if (!apiKeyToTest) {
        return new Response(JSON.stringify({ 
          success: false, 
          message: 'No API key provided for testing' 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      const testResult = await testApiKey(apiKeyToTest);
      
      return new Response(JSON.stringify(testResult), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // For regular price update requests, we need auth
    const authHeader = req.headers.get('Authorization');
    
    // Skip auth check in testing mode
    if (!params.skipAuth && !authHeader) {
      return new Response(JSON.stringify({ 
        error: 'Missing Authorization header',
        message: 'Authorization is required for this endpoint'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // Create Supabase client if not in skipAuth mode
    let supabaseClient;
    if (!params.skipAuth) {
      supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? '',
        { global: { headers: { Authorization: authHeader } } }
      );
    }
    
    // Log environment check
    console.log('Environment check:');
    console.log('SUPABASE_URL available:', Boolean(Deno.env.get('SUPABASE_URL')));
    console.log('SUPABASE_ANON_KEY available:', Boolean(Deno.env.get('SUPABASE_ANON_KEY')));
    console.log('COINGECKO_API_KEY available:', Boolean(Deno.env.get('COINGECKO_API_KEY')));
    
    // Try to get API key from database as well, to provide maximum flexibility
    let apiKey = Deno.env.get('COINGECKO_API_KEY');
    
    // Skip DB check if we're in skipAuth mode
    if (!params.skipAuth && !apiKey && supabaseClient) {
      console.log('No API key found in environment, checking database...');
      try {
        const { data: apiKeyData, error: apiKeyError } = await supabaseClient
          .from('site_settings')
          .select('value')
          .eq('key', 'coingecko_api_key')
          .maybeSingle();
          
        if (apiKeyError) {
          console.error('Error fetching API key from database:', apiKeyError);
        } else if (apiKeyData?.value) {
          apiKey = apiKeyData.value;
          console.log('Found API key in database: ' + apiKey.substring(0, 4) + '***');
        }
      } catch (e) {
        console.error('Exception fetching API key from database:', e);
      }
    } else if (params.testApiKey) {
      // Use test API key if provided
      apiKey = params.testApiKey;
      console.log('Using provided test API key');
    }
    
    // Fetch ETH price from CoinGecko
    const ethPriceResult = await fetchEthPrice(apiKey);
    
    if (!ethPriceResult.success || !ethPriceResult.price) {
      return new Response(
        JSON.stringify({ 
          error: 'Failed to fetch ETH price',
          message: ethPriceResult.message || 'Could not get current ETH price from external API',
          rateLimited: ethPriceResult.rateLimited || false
        }),
        {
          status: ethPriceResult.rateLimited ? 429 : 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
    
    const ethPrice = ethPriceResult.price;
    console.log(`Retrieved ETH price: $${ethPrice}`);
    
    // If we're just testing, return the result without updating the database
    if (params.testOnly || params.skipAuth) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'ETH price fetched successfully (test mode)',
          price: ethPrice
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
    
    // Check if price is significantly different before updating
    try {
      const { data: currentSettings, error: fetchError } = await supabaseClient
        .from('presale_settings')
        .select('eth_price')
        .eq('id', params.network === 'testnet' ? 'testnet' : 'default')
        .single();
      
      if (fetchError) {
        console.error('Error fetching current ETH price from settings:', fetchError);
      } else {
        const currentPrice = currentSettings?.eth_price;
        const priceDifference = currentPrice ? Math.abs(((ethPrice - currentPrice) / currentPrice) * 100) : 100;
        
        console.log(`Current ETH price in settings: $${currentPrice}`);
        console.log(`Price difference: ${priceDifference.toFixed(2)}%`);
        
        // Only update if price difference is more than 1%
        if (currentPrice && priceDifference < 1) {
          console.log('ETH price difference less than 1%, skipping update');
          return new Response(
            JSON.stringify({
              success: true,
              message: 'Price difference too small, not updated',
              current_price: currentPrice,
              new_price: ethPrice,
              difference_percentage: priceDifference
            }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }
      }
    } catch (error) {
      console.error('Error checking current price:', error);
      // Continue with update even if checking fails
    }
    
    // Update presale_settings table with new ETH price
    try {
      const { data, error } = await supabaseClient
        .from('presale_settings')
        .update({ eth_price: ethPrice })
        .eq('id', params.network === 'testnet' ? 'testnet' : 'default')
        .select();
      
      if (error) {
        console.error('Error updating ETH price in settings:', error);
        return new Response(
          JSON.stringify({ 
            error: 'Database update failed',
            details: error.message
          }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
      
      console.log('Successfully updated ETH price in presale_settings');
      
      return new Response(
        JSON.stringify({
          success: true,
          message: 'ETH price updated successfully',
          data: {
            ethPrice,
            settings: data
          }
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    } catch (updateError) {
      console.error('Exception updating price in database:', updateError);
      return new Response(
        JSON.stringify({
          error: 'Database operation failed',
          message: updateError instanceof Error ? updateError.message : String(updateError)
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : String(error)
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
})
