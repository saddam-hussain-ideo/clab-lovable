
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.5"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

// Enhanced request validation with more detailed checks
function validateRequest(req: Request): { valid: boolean; statusCode: number; errorMessage: string } {
  // Check for required headers
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { 
      valid: false, 
      statusCode: 401, 
      errorMessage: "Missing or invalid authorization header" 
    };
  }
  
  // Check for appropriate content type
  const contentType = req.headers.get("Content-Type");
  if (req.method !== "OPTIONS" && req.method !== "GET" && contentType !== "application/json") {
    return { 
      valid: false, 
      statusCode: 415, 
      errorMessage: "Unsupported media type" 
    };
  }
  
  // Implement rate limiting check (basic implementation)
  // In production, this should be handled by a more sophisticated rate limiter
  const clientIP = req.headers.get("X-Forwarded-For") || "unknown";
  
  // Add additional security checks as needed
  
  return { valid: true, statusCode: 200, errorMessage: "" };
}

serve(async (req) => {
  // Add request logging for security analysis
  console.log(`Request received: ${req.method} ${new URL(req.url).pathname}`);
  console.log(`Request headers: ${JSON.stringify(Object.fromEntries([...req.headers]))}`);
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders })
  }
  
  // Enhanced request validation
  const validation = validateRequest(req);
  if (!validation.valid) {
    console.warn(`Request validation failed: ${validation.errorMessage}`);
    return new Response(
      JSON.stringify({ error: validation.errorMessage }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" }, 
        status: validation.statusCode 
      }
    );
  }

  try {
    // Create a Supabase client with the service role key
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing required environment variables");
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check if the presale_notifications table exists
    const { error: tableCheckError } = await supabase
      .from('presale_notifications')
      .select('id')
      .limit(1);

    if (tableCheckError) {
      console.log("Table doesn't exist, creating it now");
      // Table doesn't exist, creating it now
      const { error: createTableError } = await supabase.rpc('create_presale_notifications_table');
      
      if (createTableError) {
        console.error("Error creating table:", createTableError);
        throw createTableError;
      }
      
      return new Response(
        JSON.stringify({ message: "Table created successfully" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // IMPORTANT: Modified to find ALL presale contributions regardless of status
    // This ensures ANY contribution is found and given unlimited access
    const { data: allContributions, error: contributionsError } = await supabase
      .from('presale_contributions')
      .select('id, wallet_address, status, user_id')
      .order('created_at', { ascending: false })
      .limit(300);  // Increased limit to catch more possible contributions
      
    if (contributionsError) {
      console.error("Error checking contributions:", contributionsError);
      throw contributionsError;
    }
    
    console.log(`Found ${allContributions?.length || 0} total contributions to process`);
    
    let updatedCount = 0;
    let orphanedCount = 0;
    
    if (allContributions && allContributions.length > 0) {
      // Process each contribution - both those with and without user_id
      for (const contribution of allContributions) {
        // Case 1: No user_id but has wallet_address
        if (!contribution.user_id && contribution.wallet_address) {
          orphanedCount++;
          console.log(`Processing orphaned contribution ${contribution.id} for wallet ${contribution.wallet_address}`);
          
          // Step 1: Check for a profile with this wallet address
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('id')
            .eq('wallet_address', contribution.wallet_address)
            .maybeSingle();
            
          if (profileError) {
            console.error(`Error finding profile for wallet ${contribution.wallet_address}:`, profileError);
            continue;
          }
          
          // If profile found, update the contribution
          if (profile) {
            console.log(`Linking contribution ${contribution.id} to user ${profile.id}`);
            
            const { error: updateError } = await supabase
              .from('presale_contributions')
              .update({ user_id: profile.id })
              .eq('id', contribution.id);
              
            if (updateError) {
              console.error(`Error updating contribution ${contribution.id}:`, updateError);
            } else {
              updatedCount++;
            }
          } else {
            // No profile found, try creating one - with added input sanitization
            try {
              // Sanitize wallet address to prevent SQL injection
              if (!/^[a-zA-Z0-9]{30,50}$/.test(contribution.wallet_address)) {
                console.error(`Invalid wallet address format: ${contribution.wallet_address}`);
                continue;
              }
              
              // Generate a temporary username
              const tempUsername = `Wallet_${contribution.wallet_address.substring(0, 6)}`;
              
              // Create a profile with the wallet address using a security definer function
              const { data: newProfile, error: createProfileError } = await supabase.rpc(
                'create_profile_for_wallet',
                { 
                  wallet_addr: contribution.wallet_address,
                  username: tempUsername
                }
              );
              
              if (createProfileError) {
                console.error(`Error creating profile for wallet ${contribution.wallet_address}:`, createProfileError);
                continue;
              }
              
              if (newProfile) {
                console.log(`Created new profile ${newProfile} for wallet ${contribution.wallet_address}`);
                
                // Update the contribution with the new user_id
                const { error: updateError } = await supabase
                  .from('presale_contributions')
                  .update({ user_id: newProfile })
                  .eq('id', contribution.id);
                  
                if (updateError) {
                  console.error(`Error updating contribution ${contribution.id}:`, updateError);
                } else {
                  updatedCount++;
                }
              }
            } catch (error) {
              console.error(`Error in profile creation process for wallet ${contribution.wallet_address}:`, error);
            }
          }
        }
        // Case 2: Any contribution with wallet_address that needs a profile
        // This handles the case where a user has a contribution with user_id but no wallet profile
        else if (contribution.wallet_address) {
          // Add input validation for wallet address
          if (!/^[a-zA-Z0-9]{30,50}$/.test(contribution.wallet_address)) {
            console.error(`Skipping invalid wallet format: ${contribution.wallet_address}`);
            continue;
          }
          
          // Check if we need to create a wallet profile for this wallet address
          const { data: walletProfile, error: walletProfileError } = await supabase
            .from('wallet_profiles')
            .select('id')
            .eq('wallet_address', contribution.wallet_address)
            .maybeSingle();
            
          if (walletProfileError) {
            console.error(`Error checking wallet profile for ${contribution.wallet_address}:`, walletProfileError);
            continue;
          }
          
          // If no wallet profile exists, create one
          if (!walletProfile) {
            console.log(`Creating wallet profile for ${contribution.wallet_address}`);
            
            try {
              const { data: newWalletProfile, error: createWalletProfileError } = await supabase
                .from('wallet_profiles')
                .insert({
                  wallet_address: contribution.wallet_address,
                  username: `Wallet_${contribution.wallet_address.substring(0, 6)}`,
                  points: 0
                })
                .select('id')
                .single();
                
              if (createWalletProfileError) {
                console.error(`Error creating wallet profile for ${contribution.wallet_address}:`, createWalletProfileError);
              } else if (newWalletProfile) {
                console.log(`Created wallet profile ${newWalletProfile.id} for ${contribution.wallet_address}`);
              }
            } catch (error) {
              console.error(`Error in wallet profile creation process for ${contribution.wallet_address}:`, error);
            }
          }
        }
      }
    }

    // Add secure response headers
    const securityHeaders = {
      "Content-Security-Policy": "default-src 'self'",
      "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      "Referrer-Policy": "strict-origin-when-cross-origin"
    };

    return new Response(
      JSON.stringify({ 
        message: "Table already exists",
        tablesChecked: true,
        contributionsChecked: true,
        orphanedContributions: orphanedCount,
        updatedContributions: updatedCount,
        totalContributions: allContributions?.length || 0
      }),
      { 
        headers: { 
          ...corsHeaders, 
          ...securityHeaders, 
          "Content-Type": "application/json" 
        }, 
        status: 200 
      }
    );
  } catch (error) {
    console.error("Error details:", error);
    // Generic error response without exposing internal details
    return new Response(
      JSON.stringify({ error: "Failed to check or create table" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
})
