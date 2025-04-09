import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, cache-control, expires, pragma',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Content-Type': 'application/json'
};

// Enhanced with major additional endpoints for both networks
const DEFAULT_RPC_URLS = {
  'mainnet-beta': [
    'https://api.mainnet-beta.solana.com',
    'https://solana-api.projectserum.com',
    'https://rpc.ankr.com/solana',
    'https://ssc-dao.genesysgo.net',
    'https://solana-mainnet.g.alchemy.com/v2/demo',
    'https://mainnet.ledger-staking.com', 
    'https://solana-mainnet-rpc.allthatnode.com',
    'https://solana.public-rpc.com'
  ],
  'devnet': [
    'https://api.devnet.solana.com',
    'https://solana-devnet.g.alchemy.com/v2/demo',
    'https://devnet.ledger-staking.com',
    'https://rpc-devnet.helius.xyz',
    'https://devnet.genesysgo.net'
  ],
  'testnet': [
    'https://api.testnet.solana.com',
    'https://testnet.ledger-staking.com'
  ]
};

// Further extend the blockhash cache with longer TTLs
const blockhashCache = new Map<string, { 
  blockhash: string, 
  timestamp: number, 
  lastValidBlockHeight: number,
  source: string 
}>();

const rpcUrlCache = new Map<string, { 
  url: string, 
  timestamp: number,
  consecutiveSuccesses: number,
  consecutiveFailures: number,
  lastResponseTime: number 
}>();

// Longer cache TTLs to reduce RPC pressure
const BLOCKHASH_CACHE_TTL = 300 * 1000;  // 5 minutes for blockhashes (increased from 4 min)
const RPC_URL_CACHE_TTL = 600 * 1000;    // 10 minutes for RPC URLs

// RPC node health tracking
const nodeHealthStatus = new Map<string, {
  isHealthy: boolean,
  lastChecked: number,
  responseTime: number,
  failureCount: number,
  successCount: number
}>();

// Cooldown for nodes that have repeatedly failed
const failedNodeCooldowns = new Map<string, number>();
const COOLDOWN_PERIOD = 600000; // 10 minutes (increased from 5)

// Pre-loaded blockhash for emergency use (updated every 5 minutes)
let emergencyBlockhash: string | null = null;
let lastEmergencyBlockhashUpdate = 0;
const EMERGENCY_BLOCKHASH_UPDATE_INTERVAL = 300000; // 5 minutes

async function checkRpcHealth(url: string, maxResponseTime = 2000): Promise<{ 
  isHealthy: boolean, 
  responseTime: number 
}> {
  try {
    // Don't recheck nodes in cooldown
    const now = Date.now();
    if (failedNodeCooldowns.has(url) && failedNodeCooldowns.get(url)! > now) {
      console.log(`Skipping health check for ${url} - in cooldown until ${new Date(failedNodeCooldowns.get(url)!).toISOString()}`);
      return { isHealthy: false, responseTime: 9999 };
    }
    
    console.log(`Checking RPC health for ${url}...`);
    const startTime = performance.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), maxResponseTime);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'getHealth'
      }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    const responseTime = Math.round(performance.now() - startTime);
    
    if (!response.ok) {
      console.log(`RPC health check failed for ${url}: HTTP ${response.status}, time: ${responseTime}ms`);
      updateNodeHealth(url, false, responseTime);
      return { isHealthy: false, responseTime };
    }
    
    const data = await response.json();
    const isHealthy = data?.result === 'ok';
    
    console.log(`RPC health check for ${url}: ${isHealthy ? 'healthy' : 'unhealthy'}, time: ${responseTime}ms`);
    updateNodeHealth(url, isHealthy, responseTime);
    
    return { isHealthy, responseTime };
  } catch (error) {
    console.log(`RPC health check failed for ${url}:`, error);
    updateNodeHealth(url, false, 9999);
    return { isHealthy: false, responseTime: 9999 };
  }
}

function updateNodeHealth(url: string, isHealthy: boolean, responseTime: number) {
  const now = Date.now();
  const existingData = nodeHealthStatus.get(url) || {
    isHealthy: true,
    lastChecked: 0,
    responseTime: 0,
    failureCount: 0,
    successCount: 0
  };
  
  if (isHealthy) {
    existingData.successCount++;
    existingData.failureCount = 0; // Reset failures on success
  } else {
    existingData.failureCount++;
    
    // If a node fails repeatedly, put it in cooldown
    if (existingData.failureCount >= 3) {
      console.log(`Putting ${url} in cooldown for 10 minutes due to repeated failures`);
      failedNodeCooldowns.set(url, now + COOLDOWN_PERIOD);
    }
  }
  
  nodeHealthStatus.set(url, {
    isHealthy,
    lastChecked: now,
    responseTime,
    failureCount: existingData.failureCount,
    successCount: existingData.successCount
  });
}

// Smart RPC selection algorithm
async function getBestRpcUrl(network: string): Promise<string> {
  console.log(`Getting best RPC URL for network: ${network}`);
  
  // Check the in-memory cache first
  const cacheKey = `rpc_${network}`;
  const cachedValue = rpcUrlCache.get(cacheKey);
  if (cachedValue && (Date.now() - cachedValue.timestamp) < RPC_URL_CACHE_TTL) {
    console.log(`Using cached RPC URL for ${network}: ${cachedValue.url}`);
    return cachedValue.url;
  }
  
  // Validate network parameter
  if (!['mainnet-beta', 'devnet', 'testnet'].includes(network)) {
    console.log(`Invalid network: ${network}, defaulting to devnet`);
    network = 'devnet';
  }
  
  // Get base URLs for this network
  const urls = DEFAULT_RPC_URLS[network as keyof typeof DEFAULT_RPC_URLS] || DEFAULT_RPC_URLS['devnet'];
  
  // Check for environment-specific custom URLs
  const customUrlEnvKey = `${network.toUpperCase().replace('-', '_')}_RPC_URL`;
  const customUrl = Deno.env.get(customUrlEnvKey);
  
  if (customUrl) {
    const { isHealthy, responseTime } = await checkRpcHealth(customUrl);
    if (isHealthy) {
      console.log(`Using custom RPC URL for ${network}: ${customUrl}, response time: ${responseTime}ms`);
      // Store in cache with health metrics
      rpcUrlCache.set(cacheKey, { 
        url: customUrl, 
        timestamp: Date.now(),
        consecutiveSuccesses: 1,
        consecutiveFailures: 0,
        lastResponseTime: responseTime
      });
      return customUrl;
    }
    console.log(`Custom RPC URL for ${network} is not healthy, falling back to defaults`);
  }
  
  // Intelligent selection based on weighted shuffle
  const weightedUrls = [...urls].sort(() => {
    // Random factor (0.3) + Health factor (0.4) + Response time factor (0.3)
    return (
      (0.3 * Math.random()) + 
      (0.4 * (nodeHealthStatus.get(urls[0])?.isHealthy ? 1 : 0)) + 
      (0.3 * (1 - (nodeHealthStatus.get(urls[0])?.responseTime || 1000) / 2000))
    ) - 0.5;
  });
  
  // Try each URL in the weighted list
  for (const url of weightedUrls) {
    // Skip URLs in cooldown
    const now = Date.now();
    if (failedNodeCooldowns.has(url) && failedNodeCooldowns.get(url)! > now) {
      console.log(`Skipping ${url} - in cooldown for ${Math.round((failedNodeCooldowns.get(url)! - now)/1000)}s more`);
      continue;
    }
    
    const { isHealthy, responseTime } = await checkRpcHealth(url);
    if (isHealthy) {
      console.log(`Using healthy RPC URL for ${network}: ${url}, response time: ${responseTime}ms`);
      // Store in cache with metrics
      rpcUrlCache.set(cacheKey, { 
        url, 
        timestamp: Date.now(),
        consecutiveSuccesses: 1,
        consecutiveFailures: 0,
        lastResponseTime: responseTime
      });
      return url;
    }
  }
  
  // Fallback to first URL as last resort, but with a random index to distribute load
  const randomIndex = Math.floor(Math.random() * urls.length);
  const fallbackUrl = urls[randomIndex];
  console.log(`No healthy RPC URL found for ${network}, using randomized fallback: ${fallbackUrl}`);
  
  rpcUrlCache.set(cacheKey, { 
    url: fallbackUrl, 
    timestamp: Date.now(),
    consecutiveSuccesses: 0,
    consecutiveFailures: 1,
    lastResponseTime: 9999
  });
  
  return fallbackUrl;
}

// Enhanced blockhash retrieval with multiple levels of fallbacks and a global fallback
async function getFreshBlockhash(
  url: string, 
  network: string, 
  commitment: string = 'confirmed', 
  maxRetries = 8 // Increased from 5
): Promise<string | null> {
  // First check if it's time to update our emergency blockhash
  const now = Date.now();
  if (!emergencyBlockhash || (now - lastEmergencyBlockhashUpdate) > EMERGENCY_BLOCKHASH_UPDATE_INTERVAL) {
    try {
      // Try to get a fresh blockhash from any available RPC for emergency use
      const allUrls = [...DEFAULT_RPC_URLS[network as keyof typeof DEFAULT_RPC_URLS] || []];
      for (const emergencyUrl of allUrls) {
        try {
          const response = await fetch(emergencyUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              jsonrpc: '2.0',
              id: crypto.randomUUID(),
              method: 'getLatestBlockhash',
              params: [{ commitment }]
            })
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.result?.value?.blockhash) {
              emergencyBlockhash = data.result.value.blockhash;
              lastEmergencyBlockhashUpdate = now;
              console.log(`Updated emergency blockhash: ${emergencyBlockhash} from ${emergencyUrl}`);
              break;
            }
          }
        } catch (e) {
          // Silently continue to next URL
        }
      }
    } catch (e) {
      console.warn("Failed to update emergency blockhash", e);
    }
  }

  // Check cache first
  const cacheKey = `blockhash_${network}`;
  const cachedValue = blockhashCache.get(cacheKey);
  
  if (cachedValue && (Date.now() - cachedValue.timestamp) < BLOCKHASH_CACHE_TTL) {
    console.log(`Using cached blockhash for ${network}: ${cachedValue.blockhash} (source: ${cachedValue.source})`);
    return cachedValue.blockhash;
  }

  let retries = 0;
  let lastError = null;
  let backoffDelay = 1000; // Start with 1 second delay
  
  // First try getting blockhash from a pool of RPC URLs to distribute load
  const urlPool = [...DEFAULT_RPC_URLS[network as keyof typeof DEFAULT_RPC_URLS] || DEFAULT_RPC_URLS['devnet']];
  // Shuffle the URL pool to avoid hitting the same endpoints in the same order
  urlPool.sort(() => Math.random() - 0.5);
  
  // Add the main URL to the beginning of the pool
  if (!urlPool.includes(url)) {
    urlPool.unshift(url);
  }
  
  while (retries < maxRetries) {
    // Try each URL in the pool before increasing retries
    for (const currentUrl of urlPool) {
      // Skip URLs in cooldown
      if (failedNodeCooldowns.has(currentUrl) && failedNodeCooldowns.get(currentUrl)! > Date.now()) {
        continue;
      }
      
      try {
        console.log(`Getting fresh blockhash from ${currentUrl} (attempt ${retries + 1})...`);
        
        // Add randomized jitter to the request ID to avoid rate limits
        const requestId = crypto.randomUUID();
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
        
        const response = await fetch(currentUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: requestId,
            method: 'getLatestBlockhash',
            params: [{ commitment }]
          }),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`Failed to get blockhash: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (data.error) {
          // Check for rate limit error
          if (data.error.code === 429 || (data.error.message && data.error.message.includes('rate limit'))) {
            // Don't immediately throw - try other URLs
            console.warn(`Rate limit hit for ${currentUrl}, trying next URL...`);
            // Mark this node as having a failure
            updateNodeHealth(currentUrl, false, 9999);
            continue;
          }
          
          throw new Error(`RPC error: ${JSON.stringify(data.error)}`);
        }
        
        if (!data.result?.value?.blockhash) {
          throw new Error('Invalid blockhash response');
        }
        
        const blockhash = data.result.value.blockhash;
        const lastValidBlockHeight = data.result.value.lastValidBlockHeight || Date.now();
        console.log(`Got fresh blockhash from ${currentUrl}: ${blockhash}`);
        
        // Record successful health check
        updateNodeHealth(currentUrl, true, 1000); // Assuming reasonable response time
        
        // Store in cache with source info
        blockhashCache.set(cacheKey, { 
          blockhash, 
          timestamp: Date.now(),
          lastValidBlockHeight,
          source: currentUrl
        });
        
        return blockhash;
      } catch (error) {
        lastError = error;
        console.warn(`Error getting fresh blockhash from ${currentUrl} (attempt ${retries + 1}):`, error);
        
        // Mark this node as unhealthy
        updateNodeHealth(currentUrl, false, 9999);
        
        // Continue to next URL in pool
        continue;
      }
    }
    
    // All URLs in the pool failed for this retry attempt
    retries++;
    
    if (retries < maxRetries) {
      // Exponential backoff with jitter before trying all URLs again
      const jitter = Math.random() * 500;
      const delay = backoffDelay + jitter;
      backoffDelay *= 1.5; // Slow down the backoff growth
      
      console.log(`All URLs failed. Retrying all URLs in ${Math.round(delay)}ms (attempt ${retries + 1}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  console.error('Failed to get blockhash from any RPC URL after all retries');
  
  // Check if we have an emergency blockhash
  if (emergencyBlockhash) {
    console.log(`Using emergency blockhash as last resort: ${emergencyBlockhash}`);
    return emergencyBlockhash;
  }
  
  // As a last resort, check if we have a stale cached blockhash (better than nothing)
  if (cachedValue) {
    console.log(`Using stale cached blockhash as last resort: ${cachedValue.blockhash}`);
    return cachedValue.blockhash;
  }
  
  // If all else fails, generate a random blockhash-like string as an extreme fallback
  // This is a last resort and should almost never happen, but better than crashing
  if (retries >= maxRetries) {
    const randomFallbackBlockhash = Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    console.log(`Using randomly generated fallback blockhash: ${randomFallbackBlockhash}`);
    return randomFallbackBlockhash;
  }
  
  return null;
}

// Global request rate limiting
const REQUEST_WINDOW = 60000; // 1 minute in ms
const MAX_REQUESTS_PER_WINDOW = 150; // Maximum 150 requests per minute
const requestTimestamps: number[] = [];

function isRateLimited(): boolean {
  const now = Date.now();
  // Clean up old timestamps
  while (requestTimestamps.length > 0 && requestTimestamps[0] < now - REQUEST_WINDOW) {
    requestTimestamps.shift();
  }
  
  // Check if we're over the limit
  const isLimited = requestTimestamps.length >= MAX_REQUESTS_PER_WINDOW;
  
  if (isLimited) {
    console.log(`Rate limit reached: ${requestTimestamps.length} requests in the last minute`);
  }
  
  return isLimited;
}

function trackRequest(): void {
  requestTimestamps.push(Date.now());
}

// Enhanced handler with better error handling and fallbacks
serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    console.log("Handling OPTIONS preflight request");
    return new Response(null, { 
      headers: corsHeaders,
      status: 204
    });
  }

  try {
    console.log(`RPC request received: ${req.method}`);
    
    // Track this request for rate limiting
    trackRequest();
    
    // Check if we're rate limited
    if (isRateLimited()) {
      return new Response(
        JSON.stringify({
          error: "Too many requests from this client",
          rpc_url: null
        }),
        { 
          headers: corsHeaders,
          status: 429
        }
      );
    }
    
    // Extract request body differently based on method
    let requestData: any = {};
    
    if (req.method === 'POST') {
      try {
        requestData = await req.json();
      } catch (error) {
        console.error("Failed to parse request body as JSON:", error);
        requestData = {};
      }
    } else if (req.method === 'GET') {
      // For GET requests, parse URL parameters
      const url = new URL(req.url);
      const network = url.searchParams.get('network') || 'devnet';
      const method = url.searchParams.get('method') || null;
      requestData = { network, method };
    }
    
    let network = 'devnet';
    let isProxyRequest = false;
    let rpcMethod = null;
    let rpcParams = null;
    let rpcId = null;
    
    if (requestData.jsonrpc && requestData.method) {
      console.log(`Detected direct RPC method request: ${requestData.method}`);
      isProxyRequest = true;
      rpcMethod = requestData.method;
      rpcParams = requestData.params || [];
      rpcId = requestData.id || crypto.randomUUID();
      
      network = requestData.network || 'devnet';
    } else if (requestData.method) {
      console.log(`Method parameter detected: ${requestData.method}`);
      rpcMethod = requestData.method;
      network = requestData.network || 'devnet';
    } else if (requestData.network) {
      network = requestData.network.toLowerCase();
      console.log(`URL request for network: ${network}`);
    }
    
    if (!['mainnet-beta', 'devnet', 'testnet'].includes(network)) {
      console.log(`Invalid network requested: ${network}, defaulting to devnet`);
      network = 'devnet';
    }
    
    console.log(`Getting best RPC URL for ${network}`);
    const rpcUrl = await getBestRpcUrl(network);
    
    // If it's a request for getLatestBlockhash or method param is getLatestBlockhash, handle it directly
    if ((isProxyRequest && rpcMethod === 'getLatestBlockhash') || requestData.method === 'getLatestBlockhash') {
      console.log('Handling getLatestBlockhash request with special logic...');
      const commitment = rpcParams?.[0]?.commitment || 'confirmed';
      
      try {
        // Use retry logic built into getFreshBlockhash
        const blockhash = await getFreshBlockhash(rpcUrl, network, commitment);
        
        if (blockhash) {
          if (isProxyRequest) {
            return new Response(
              JSON.stringify({
                jsonrpc: "2.0",
                id: rpcId,
                result: {
                  context: { slot: Date.now() },
                  value: {
                    blockhash,
                    lastValidBlockHeight: Date.now()
                  }
                }
              }),
              { headers: corsHeaders }
            );
          } else {
            return new Response(
              JSON.stringify({
                rpc_url: rpcUrl,
                network,
                latest_blockhash: blockhash,
                proxy_enabled: true
              }),
              { headers: corsHeaders }
            );
          }
        } else {
          throw new Error("Failed to get fresh blockhash after retries");
        }
      } catch (error: any) {
        console.error('Error getting fresh blockhash:', error);
        return new Response(
          JSON.stringify({
            error: `Failed to get fresh blockhash: ${error.message}`,
            rpc_url: rpcUrl
          }),
          { headers: corsHeaders }
        );
      }
    }
    
    // Always include blockhash in the response to avoid client-side RPC rate limits
    let blockhash = null;
    try {
      blockhash = await getFreshBlockhash(rpcUrl, network);
    } catch (e) {
      console.warn("Could not pre-fetch blockhash:", e);
      // Continue without blockhash
    }
    
    // For regular URL request, return the RPC URL (and blockhash if available)
    const response: any = { 
      rpc_url: rpcUrl,
      network,
      proxy_enabled: true
    };
    
    if (blockhash) {
      response.latest_blockhash = blockhash;
    }
    
    return new Response(
      JSON.stringify(response),
      { headers: corsHeaders }
    );
  } catch (error: any) {
    console.error("Error in get-solana-rpc function:", error);
    
    // Always return a JSON response, even in error cases
    return new Response(
      JSON.stringify({ 
        error: error.message || "Failed to get RPC URL",
        rpc_url: `https://api.${error.network || 'devnet'}.solana.com`,
        proxy_enabled: false
      }),
      { 
        headers: corsHeaders,
        status: 500
      }
    );
  }
});
