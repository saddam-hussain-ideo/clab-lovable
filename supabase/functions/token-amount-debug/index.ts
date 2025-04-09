
import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Function to validate and sanitize input
function validateInput(input: any) {
  // Basic validation
  if (!input) return false;
  
  // Required field validation
  if (!input.wallet || typeof input.wallet !== 'string') return false;
  if (input.tokenAmount === undefined || input.tokenAmount === null) return false;
  
  // Format validation
  if (typeof input.wallet !== 'string' || input.wallet.length < 5) return false;
  if (isNaN(Number(input.tokenAmount))) return false;
  
  // Sanitize known fields
  if (input.source && typeof input.source === 'string') {
    input.source = input.source.replace(/[<>]/g, '');
  }
  
  if (input.currency && typeof input.currency === 'string') {
    input.currency = input.currency.replace(/[<>]/g, '');
  }
  
  return true;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    // Get request body
    let body;
    try {
      body = await req.json();
    } catch (e) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid JSON request body" }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    
    // Validate request body
    if (!validateInput(body)) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid request parameters" }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    
    const { wallet, tokenAmount, source, recordId, currency, paymentAmount, trackingId, isConsistent } = body;
    const timestamp = new Date().toISOString();
    
    // Create a log entry with minimal sensitive information
    const logEntry = {
      wallet_address: wallet,
      token_amount: tokenAmount,
      source: source,
      record_id: recordId,
      currency: currency,
      payment_amount: paymentAmount,
      timestamp: timestamp,
      tracking_id: trackingId || `auto_${Date.now()}`,
      request_id: crypto.randomUUID(),
      is_consistent: isConsistent === true
    };
    
    // Store the log in a table for future reference
    if (wallet && tokenAmount) {
      await supabaseClient
        .from('token_debug_logs')
        .insert(logEntry);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Token amount logged successfully',
        timestamp: timestamp,
        trackingId: trackingId || `auto_${Date.now()}`,
        requestId: logEntry.request_id
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    );
  } catch (error) {
    // Generic error response without exposing internal details
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: "An error occurred processing the request"
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        },
        status: 500
      }
    );
  }
})
