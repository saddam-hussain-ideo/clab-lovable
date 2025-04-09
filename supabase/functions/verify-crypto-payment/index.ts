
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.1";
import { corsHeaders } from "../_shared/cors.ts";

// Create a Supabase client with the admin key
const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }

  try {
    const { userId, walletAddress, checkOnly } = await req.json();
    
    // Always require either userId or walletAddress
    if (!userId && !walletAddress) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required parameters',
          success: false
        }), 
        { 
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
          status: 400 
        }
      );
    }

    console.log(`Verifying access for: userId=${userId}, walletAddress=${walletAddress}, checkOnly=${checkOnly}`);
    
    // Track this attempt if not just checking
    if (!checkOnly) {
      try {
        if (userId) {
          // Insert attempt into user_quiz_attempts for authenticated users
          const { error: insertError } = await supabaseAdmin
            .from('user_quiz_attempts')
            .insert({
              user_id: userId
            });
            
          if (insertError) {
            console.error("Error tracking attempt:", insertError);
          } else {
            console.log(`Successfully recorded attempt for user ${userId}`);
          }
        } else if (walletAddress) {
          // Track wallet attempts in separate table
          const { error: insertError } = await supabaseAdmin
            .from('wallet_quiz_attempts')
            .insert({
              wallet_address: walletAddress,
              score: 0,
              questions_answered: 0,
              correct_answers: 0,
              perfect_rounds: 0
            });
            
          if (insertError) {
            console.error("Error tracking wallet attempt:", insertError);
          } else {
            console.log(`Successfully recorded attempt for wallet ${walletAddress}`);
          }
        }
      } catch (trackError) {
        console.error("Error tracking attempt:", trackError);
        // Continue processing even if tracking fails
      }
    }

    // Check if user has presale contribution (unlimited access)
    let hasUnlimitedAccess = false;
    let attemptsRemaining = 5; // Default FREE_ROUNDS_LIMIT

    if (userId) {
      // First check if user has ANY presale contribution
      const { data: userContributions, error: userContribError } = await supabaseAdmin
        .from('presale_contributions')
        .select('id')
        .eq('user_id', userId)
        .limit(1);
        
      if (userContribError) {
        console.error('Error checking user presale contributions:', userContribError);
      } else if (userContributions && userContributions.length > 0) {
        // User has ANY presale contribution, grant unlimited access
        console.log('User has presale contribution, granting unlimited access');
        hasUnlimitedAccess = true;
      } else {
        // Count total attempts directly with count option
        const { count, error: countError } = await supabaseAdmin
          .from('user_quiz_attempts')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId);
          
        if (countError) {
          console.error('Error counting attempts:', countError);
        } else {
          // Now we have an accurate count
          const totalAttempts = count || 0;
          attemptsRemaining = Math.max(0, 5 - totalAttempts);
          console.log(`User has made ${totalAttempts} attempts, has ${attemptsRemaining} remaining`);
        }
      }
    } else if (walletAddress) {
      // Check if wallet has presale contribution
      const { data: walletContributions, error: walletContribError } = await supabaseAdmin
        .from('presale_contributions')
        .select('id')
        .eq('wallet_address', walletAddress)
        .limit(1);
        
      if (walletContribError) {
        console.error('Error checking wallet presale contributions:', walletContribError);
      } else if (walletContributions && walletContributions.length > 0) {
        // Wallet has ANY presale contribution, grant unlimited access
        console.log('Wallet has presale contribution, granting unlimited access');
        hasUnlimitedAccess = true;
      } else {
        // For wallet users, count attempts from wallet_quiz_attempts with count option
        const { count, error: countError } = await supabaseAdmin
          .from('wallet_quiz_attempts')
          .select('*', { count: 'exact', head: true })
          .eq('wallet_address', walletAddress);
          
        if (countError) {
          console.error('Error counting wallet attempts:', countError);
        } else {
          // Now we have an accurate count
          const totalAttempts = count || 0;
          attemptsRemaining = Math.max(0, 5 - totalAttempts);
          console.log(`Wallet ${walletAddress} has ${attemptsRemaining} attempts remaining`);
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        hasUnlimitedAccess,
        attemptsRemaining,
        success: true
      }),
      { 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    );
  } catch (error) {
    console.error('Error processing request:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        success: false
      }),
      { 
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
        status: 500 
      }
    );
  }
});
