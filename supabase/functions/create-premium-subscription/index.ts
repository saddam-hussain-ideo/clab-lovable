
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

// Define response type for clarity
interface ResponseType {
  success: boolean;
  message?: string;
  error?: string;
  data?: any;
}

serve(async (req) => {
  console.log('Processing premium subscription request');
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS preflight request');
    return new Response(null, { 
      headers: corsHeaders, 
      status: 204 
    });
  }

  try {
    // Basic environment validation
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Missing Supabase environment variables');
      
      const errorResponse: ResponseType = {
        success: false,
        error: 'Server configuration error'
      };
      
      return new Response(JSON.stringify(errorResponse), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      });
    }

    // Create Supabase client with service role key to bypass RLS
    const supabase = createClient(
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY
    );

    // Parse request body - with enhanced error handling
    let userId;
    let bodyText = '';
    
    try {
      // First try to get the body as text
      bodyText = await req.text();
      console.log('Raw request body:', bodyText);
      
      // Handle empty body case
      if (!bodyText || bodyText.trim() === '') {
        console.error('Empty request body received');
        
        const errorResponse: ResponseType = {
          success: false,
          error: 'Empty request body'
        };
        
        return new Response(JSON.stringify(errorResponse), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        });
      }
      
      // Parse the JSON body
      let requestData;
      try {
        requestData = JSON.parse(bodyText);
        console.log('Parsed request data:', requestData);
      } catch (parseError) {
        console.error('JSON parse error:', parseError, 'Raw body:', bodyText);
        
        const errorResponse: ResponseType = {
          success: false,
          error: `Invalid JSON format: ${parseError instanceof Error ? parseError.message : String(parseError)}`
        };
        
        return new Response(JSON.stringify(errorResponse), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        });
      }
      
      // Extract userId from the request - support multiple formats
      if (typeof requestData === 'object') {
        userId = requestData.userId;
      }
      
      // Final validation check
      if (!userId) {
        console.error('No userId found in request: ', requestData);
        
        const errorResponse: ResponseType = {
          success: false,
          error: 'User ID is required'
        };
        
        return new Response(JSON.stringify(errorResponse), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400
        });
      }
    } catch (parseError) {
      console.error('Error parsing request:', parseError, 'Body:', bodyText);
      
      const errorResponse: ResponseType = {
        success: false,
        error: 'Invalid request format: ' + (parseError instanceof Error ? parseError.message : String(parseError))
      };
      
      return new Response(JSON.stringify(errorResponse), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      });
    }

    console.log('Processing premium subscription for user:', userId);
    
    // Generate a unique payment hash
    const paymentHash = `edge_function_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;

    // Direct insert using service role which bypasses RLS
    try {
      const { data: insertData, error: insertError } = await supabase
        .from('premium_subscriptions')
        .insert({
          user_id: userId,
          payment_tx_hash: paymentHash,
          payment_currency: 'SOL',
          payment_amount: 0,
          expires_at: null // null for no expiration (permanent)
        })
        .select('id')
        .single();

      if (insertError) {
        console.error('Database insert error:', insertError);
        throw insertError;
      }

      console.log('Premium subscription created successfully via direct insert:', insertData);

      // Return a properly structured response
      const response: ResponseType = {
        success: true,
        message: 'Premium subscription created successfully',
        data: insertData
      };

      return new Response(JSON.stringify(response), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
    } catch (error) {
      console.error('Error creating premium subscription:', error);
      
      const errorResponse: ResponseType = {
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };

      return new Response(JSON.stringify(errorResponse), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      });
    }
  } catch (error: any) {
    console.error('Error in premium subscription function:', error);
    
    const errorResponse: ResponseType = {
      success: false, 
      error: error.message || 'Unknown error occurred'
    };

    return new Response(JSON.stringify(errorResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});
