
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

// Helper function to read config values from Deno environment
function getConfigValue(key: string, fallback: string): string {
  return Deno.env.get(key) || fallback;
}

serve(async (req) => {
  // Handle CORS for preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { keys } = await req.json();
    
    if (!Array.isArray(keys)) {
      throw new Error('Invalid request: keys must be an array');
    }
    
    const config: Record<string, string> = {};
    
    // Add requested config values
    for (const key of keys) {
      switch (key) {
        case 'USDC_TOKEN_PRICE_FALLBACK':
          config[key] = getConfigValue('USDC_TOKEN_PRICE_FALLBACK', '0.00015');
          break;
        case 'USDT_TOKEN_PRICE_FALLBACK':
          config[key] = getConfigValue('USDT_TOKEN_PRICE_FALLBACK', '0.00015');
          break;
        default:
          // Skip keys we don't recognize
          continue;
      }
    }
    
    return new Response(
      JSON.stringify(config),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        },
        status: 200 
      }
    )
  } catch (error) {
    console.error('Error in get-config-values:', error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        },
        status: 400 
      }
    )
  }
})
