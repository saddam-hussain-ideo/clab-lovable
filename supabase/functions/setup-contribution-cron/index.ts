
import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { corsHeaders } from "../_shared/cors.ts"

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // First, try to drop the existing cron job if it exists
    const { data: existingJobs, error: queryError } = await supabase
      .rpc('check_contribution_cron_exists')
    
    if (queryError) {
      console.error('Error checking existing cron jobs:', queryError)
    }
    
    // If the cron job exists, drop it
    if (existingJobs && existingJobs.exists) {
      const { error: dropError } = await supabase
        .rpc('drop_contribution_cron')
      
      if (dropError) {
        console.error('Error dropping existing cron job:', dropError)
      } else {
        console.log('Successfully dropped existing cron job')
      }
    }
    
    // Create the new cron job that runs every 15 minutes
    const { data, error } = await supabase
      .rpc('create_contribution_cron_15min')
    
    if (error) {
      throw error
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Contribution update cron job created to run every 15 minutes',
        data
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error setting up cron job:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Unknown error'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
