import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.32.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Function to fetch cryptocurrency prices from CoinGecko
async function fetchCryptoPrices(cryptoIds: string[]) {
  try {
    if (!cryptoIds || cryptoIds.length === 0) {
      throw new Error('No cryptocurrency IDs provided');
    }
    
    console.log('Fetching prices for cryptocurrencies:', cryptoIds);
    
    // Try to get API key from secrets
    let apiKey = Deno.env.get('COINGECKO_API_KEY');
    
    // Also try to fetch from the database if not in env
    if (!apiKey) {
      console.log('No API key in environment, attempting to fetch from database');
      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') || '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
      )
      
      const { data: keyData } = await supabaseClient
        .from('site_settings')
        .select('value')
        .eq('key', 'coingecko_api_key')
        .maybeSingle();
        
      if (keyData?.value) {
        console.log('Successfully fetched API key from database');
        // Use the key from db
        apiKey = keyData.value;
      }
    }
    
    if (apiKey) {
      console.log(`Using CoinGecko API key: ${apiKey.substring(0, 4)}***`);
      
      // Construct the URL with the cryptocurrency IDs
      const idsParam = cryptoIds.join(',');
      const url = `https://pro-api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${idsParam}&order=market_cap_desc&sparkline=false&price_change_percentage=24h`;
      
      console.log(`Requesting from URL (with API key): ${url}`);
      
      const response = await fetch(url, { 
        headers: {
          'x-cg-pro-api-key': apiKey
        },
        signal: AbortSignal.timeout(10000)
      });
      
      console.log(`CoinGecko API response status (with API key): ${response.status}`);
      
      if (response.ok) {
        const coinsData = await response.json();
        console.log(`Received data for ${coinsData.length} cryptocurrencies`);
        
        // Convert array to object with IDs as keys for easier access
        const prices: Record<string, any> = {};
        coinsData.forEach((coin: any) => {
          prices[coin.id] = {
            id: coin.id,
            symbol: coin.symbol,
            name: coin.name,
            current_price: coin.current_price,
            price_change_percentage_24h: coin.price_change_percentage_24h,
            market_cap: coin.market_cap,
            last_updated: coin.last_updated
          };
        });
        
        return prices;
      } else if (response.status === 429) {
        console.log('CoinGecko API rate limit reached, using mock data');
        throw new Error('CoinGecko API rate limit reached');
      } else {
        console.error(`CoinGecko API error: ${response.status} ${response.statusText}`);
        throw new Error(`CoinGecko API error: ${response.status} ${response.statusText}`);
      }
    } else {
      console.log('No API key available, falling back to public API');
    }
    
    // Set the base API URL based on whether we have an API key
    const baseUrl = apiKey 
      ? 'https://pro-api.coingecko.com/api/v3' 
      : 'https://api.coingecko.com/api/v3';
    
    // Construct the URL with the cryptocurrency IDs
    const idsParam = cryptoIds.join(',');
    const url = `${baseUrl}/coins/markets?vs_currency=usd&ids=${idsParam}&order=market_cap_desc&sparkline=false&price_change_percentage=24h`;
    
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
      
      if (response.status === 429) {
        console.log('CoinGecko API rate limit reached, falling back to mock data');
        throw new Error('Rate limit reached');
      }
      
      throw new Error(`CoinGecko API error: ${response.status} ${response.statusText}`);
    }
    
    const coinsData = await response.json();
    console.log(`Received data for ${coinsData.length} cryptocurrencies`);
    
    // Convert array to object with IDs as keys for easier access
    const prices: Record<string, any> = {};
    coinsData.forEach((coin: any) => {
      prices[coin.id] = {
        id: coin.id,
        symbol: coin.symbol,
        name: coin.name,
        current_price: coin.current_price,
        price_change_percentage_24h: coin.price_change_percentage_24h,
        market_cap: coin.market_cap,
        last_updated: coin.last_updated
      };
    });
    
    return prices;
  } catch (error) {
    console.error('Error fetching cryptocurrency prices:', error);
    throw error;
  }
}

// Test the API key by making a simple request to the coins/list endpoint
async function testApiKey(apiKey: string | null) {
  if (!apiKey) {
    return { success: false, message: 'No API key provided' };
  }
  
  console.log('Testing CoinGecko API key with a simple request...');
  
  try {
    // Use the /coins/list endpoint which is more reliable for testing
    const url = 'https://pro-api.coingecko.com/api/v3/coins/list?include_platform=false';
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'x-cg-pro-api-key': apiKey,
        'Content-Type': 'application/json'
      },
      signal: AbortSignal.timeout(10000)
    });
    
    console.log(`CoinGecko API key test response status: ${response.status}`);
    
    if (response.ok) {
      // We don't need the full response data, just check if it returns valid JSON
      await response.json();
      console.log('CoinGecko API key test successful');
      return { success: true, message: 'API key is valid and working correctly' };
    } else {
      const errorText = await response.text().catch(() => 'Unknown error');
      console.error(`CoinGecko API key test failed (${response.status}): ${errorText}`);
      return { 
        success: false, 
        message: `API key test failed: ${response.status} ${response.statusText}`,
        details: errorText
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

// Generate mock prices for testing or when API is unavailable
function generateMockPrices(cryptoIds: string[]) {
  console.log('Generating mock prices for:', cryptoIds);
  
  const baseValues = {
    bitcoin: 36000,
    ethereum: 1971,
    solana: 145,
    binancecoin: 550,
    ripple: 0.52,
    cardano: 0.45,
    polkadot: 6.2,
    dogecoin: 0.12,
    avalanche: 28,
    tron: 0.13
  };
  
  const mockPrices: Record<string, any> = {};
  
  cryptoIds.forEach(id => {
    // Get base value or generate random if not known
    const baseValue = (baseValues as any)[id] || 10 + Math.random() * 100;
    const randomChange = (Math.random() * 5) - 2.5; // -2.5% to +2.5%
    const price = baseValue + (baseValue * (randomChange / 100));
    
    mockPrices[id] = {
      id,
      symbol: id.substring(0, 3),
      name: id.charAt(0).toUpperCase() + id.slice(1),
      current_price: price,
      price_change_percentage_24h: randomChange,
      market_cap: Math.floor(price * 1000000 * (10 + Math.random() * 90)),
      last_updated: new Date().toISOString()
    };
  });
  
  return mockPrices;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
    })
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
    
    // Get parameters from request
    let params: { 
      cryptoIds?: string[], 
      useMock?: boolean,
      testApiKey?: string,
      testOnly?: boolean
    } = {}
    try {
      params = await req.json()
    } catch (error) {
      console.error('Error parsing request body:', error);
      return new Response(JSON.stringify({
        error: 'Invalid request body',
        message: 'Could not parse JSON body'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    
    console.log('Request parameters:', params);
    
    // Check if this is an API key test request
    if (params.testOnly === true) {
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
    
    // For regular price requests, ensure cryptoIds is provided
    if (!params.cryptoIds || !Array.isArray(params.cryptoIds) || params.cryptoIds.length === 0) {
      return new Response(JSON.stringify({
        error: 'Invalid parameters',
        message: 'cryptoIds must be a non-empty array'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    
    // Get request authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    
    try {
      // If mock data is requested, return mock prices
      if (params.useMock === true) {
        const mockPrices = generateMockPrices(params.cryptoIds);
        
        return new Response(JSON.stringify({
          success: true,
          mock: true,
          prices: mockPrices
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      
      // Otherwise fetch real prices from CoinGecko
      const prices = await fetchCryptoPrices(params.cryptoIds);
      
      return new Response(JSON.stringify({
        success: true,
        mock: false,
        prices
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    } catch (error) {
      console.error('Error processing request:', error);
      
      // Check for rate limiting specifically
      if (error instanceof Error && 
         (error.message.includes('rate limit') || 
          error.message.includes('429'))) {
        console.log('Rate limiting detected, using mock data with appropriate flag');
        const mockPrices = generateMockPrices(params.cryptoIds);
        
        return new Response(JSON.stringify({
          success: true,
          mock: true,
          fallback: true,
          rateLimited: true,
          error: 'CoinGecko API rate limit reached',
          prices: mockPrices
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      
      // If real prices fail for other reasons, fall back to mock prices
      console.log('Falling back to mock prices due to error');
      const mockPrices = generateMockPrices(params.cryptoIds);
      
      return new Response(JSON.stringify({
        success: true,
        mock: true,
        fallback: true,
        error: error instanceof Error ? error.message : String(error),
        prices: mockPrices
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : String(error)
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
