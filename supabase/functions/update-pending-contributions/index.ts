
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

    // Parse the request body
    const { network = 'testnet' } = await req.json()

    console.log(`Processing pending contributions for network: ${network}`)

    // Find all pending transactions that need processing, including Ethereum transactions
    const { data: pendingContributions, error: fetchError } = await supabase
      .from('presale_contributions')
      .select('*')
      .in('status', ['pending', 'confirmed'])
      
    if (fetchError) {
      console.error("Error fetching pending contributions:", fetchError)
      throw fetchError
    }

    console.log(`Found ${pendingContributions?.length || 0} pending contributions`)
    
    if (!pendingContributions || pendingContributions.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          updated: 0,
          message: "No pending contributions found" 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    // Process each pending transaction to "completed" status
    let updatedCount = 0
    let errors = []

    for (const contribution of pendingContributions) {
      try {
        // First check if this transaction is already verified via blockchain
        // This would typically connect to blockchain API, but for now we'll just check if it has a transaction hash
        const isVerified = contribution.tx_hash && contribution.tx_hash.length > 0
        
        console.log(`Processing contribution ${contribution.id} - Status: ${contribution.status}, Verified: ${isVerified}`)
        
        if (isVerified) {
          // Calculate the correct SOL amount for Solana transactions if it's missing
          // This ensures SOL values are preserved for total calculations
          let updateData = {
            updated_at: new Date().toISOString()
          }
          
          // If status is pending, update to confirmed first
          if (contribution.status === 'pending') {
            updateData.status = 'confirmed'
            
            // If it's a SOL transaction, ensure sol_amount is populated correctly
            if (contribution.currency === 'SOL' && (!contribution.sol_amount || contribution.sol_amount <= 0) && contribution.original_amount) {
              updateData.sol_amount = contribution.original_amount
              console.log(`Setting sol_amount to ${contribution.original_amount} for contribution ${contribution.id}`)
            }
            
            const { error: updateToPendingError } = await supabase
              .from('presale_contributions')
              .update(updateData)
              .eq('id', contribution.id)
              
            if (updateToPendingError) {
              console.error(`Error updating contribution ${contribution.id} to confirmed:`, updateToPendingError)
              errors.push({
                id: contribution.id,
                error: updateToPendingError.message
              })
              continue
            }
            
            console.log(`Updated contribution ${contribution.id} from pending to confirmed status`)
            updatedCount++
          }
          // If status is confirmed, update to completed
          else if (contribution.status === 'confirmed') {
            updateData.status = 'completed'
            
            // Ensure SOL amount is set correctly for completed transactions too
            if (contribution.currency === 'SOL' && (!contribution.sol_amount || contribution.sol_amount <= 0) && contribution.original_amount) {
              updateData.sol_amount = contribution.original_amount
              console.log(`Setting sol_amount to ${contribution.original_amount} for contribution ${contribution.id}`)
            }
            
            const { error: updateError } = await supabase
              .from('presale_contributions')
              .update(updateData)
              .eq('id', contribution.id)
              
            if (updateError) {
              console.error(`Error updating contribution ${contribution.id} to completed:`, updateError)
              errors.push({
                id: contribution.id,
                error: updateError.message
              })
              continue
            }
            
            updatedCount++
            console.log(`Updated contribution ${contribution.id} from confirmed to completed status`)
          }
        } else {
          console.log(`Contribution ${contribution.id} not verified yet - missing transaction hash`)
        }
      } catch (error) {
        console.error(`Error processing contribution ${contribution.id}:`, error)
        errors.push({
          id: contribution.id,
          error: error.message || "Unknown error"
        })
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        updated: updatedCount,
        errors: errors.length > 0 ? errors : undefined,
        message: `Successfully updated ${updatedCount} contributions` 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error("Error processing pending contributions:", error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || "Unknown error" 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
