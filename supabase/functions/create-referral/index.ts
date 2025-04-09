
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create a Supabase client with the Admin key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    // Parse request body
    const { referrer_id, referred_id } = await req.json()
    console.log(`Creating referral: Referrer=${referrer_id}, Referred=${referred_id}`)

    if (!referrer_id || !referred_id) {
      console.error('Missing required parameters')
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing required parameters (referrer_id or referred_id)' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Prevent self-referrals
    if (referrer_id === referred_id) {
      console.error('Self-referral attempt detected')
      return new Response(
        JSON.stringify({ success: false, error: 'Self-referrals are not allowed' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Check if users exist in profiles table
    const { data: referrerData, error: referrerError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('id', referrer_id)
      .single()

    if (referrerError || !referrerData) {
      console.error('Referrer not found:', referrerError?.message)
      return new Response(
        JSON.stringify({ success: false, error: 'Referrer not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      )
    }

    const { data: referredData, error: referredError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('id', referred_id)
      .single()

    if (referredError || !referredData) {
      console.error('Referred user not found:', referredError?.message)
      return new Response(
        JSON.stringify({ success: false, error: 'Referred user not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      )
    }

    // Check if referral already exists
    const { data: existingReferral, error: existingReferralError } = await supabaseAdmin
      .from('referrals')
      .select('id')
      .eq('referrer_id', referrer_id)
      .eq('referred_id', referred_id)
      .maybeSingle()

    if (existingReferralError) {
      console.error('Error checking existing referrals:', existingReferralError.message)
    }

    if (existingReferral) {
      console.log('Referral already exists, not creating duplicate')
      return new Response(
        JSON.stringify({ success: true, message: 'Referral already exists' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create the referral
    const { data: insertedReferral, error: insertError } = await supabaseAdmin
      .from('referrals')
      .insert({
        referrer_id: referrer_id,
        referred_id: referred_id
      })
      .select()

    if (insertError) {
      console.error('Error creating referral:', insertError.message)
      return new Response(
        JSON.stringify({ success: false, error: insertError.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    console.log('Referral created successfully:', insertedReferral)
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Referral created successfully', 
        data: insertedReferral 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Unexpected error:', error.message)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
