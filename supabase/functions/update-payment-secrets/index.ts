
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { Connection, PublicKey } from "https://esm.sh/@solana/web3.js@1.87.6";
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from "https://esm.sh/@solana/spl-token@0.3.9";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Official token mint addresses (for reference)
const OFFICIAL_MINT_ADDRESSES = {
  'USDC': 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  'USDT': 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB'
};

// Helper function to check if an account has an associated token account
async function checkAssociatedTokenAccount(connection: Connection, walletAddress: string, mintAddress: string) {
  try {
    const wallet = new PublicKey(walletAddress);
    const mint = new PublicKey(mintAddress);
    
    // Get the associated token account address
    const associatedTokenAddress = await getAssociatedTokenAddress(
      mint,
      wallet
    );
    
    console.log(`Associated token account address: ${associatedTokenAddress.toString()}`);
    
    // Check if the account exists
    const accountInfo = await connection.getAccountInfo(associatedTokenAddress);
    
    if (accountInfo) {
      console.log(`Associated token account exists with ${accountInfo.lamports} lamports`);
      console.log(`Account data length: ${accountInfo.data.length} bytes`);
      return true;
    } else {
      console.log(`No associated token account found for this wallet and mint`);
      return false;
    }
  } catch (error) {
    console.error(`Error checking associated token account: ${error}`);
    return false;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { addresses } = await req.json();
    console.log("Received addresses for updating secrets:", addresses);
    
    // Create a service role client to access admin functionality
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    // Authenticate the request
    const authHeader = req.headers.get('Authorization')!;
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      console.error("Authentication error:", userError);
      throw new Error('Unauthorized');
    }
    
    // Check if user has admin role
    const { data: roleData, error: roleError } = await supabaseAdmin.rpc(
      'has_role',
      { user_id: user.id, required_role: 'admin' }
    );
    
    if (roleError || !roleData) {
      console.error("Role check error:", roleError);
      throw new Error('Unauthorized: Admin role required');
    }
    
    // Get RPC URL from environment or use default
    const useDevnet = Deno.env.get('USE_DEVNET') === 'true';
    const rpcUrl = Deno.env.get('SOLANA_RPC_URL') || 
                  (useDevnet ? 'https://api.devnet.solana.com' : 'https://api.mainnet-beta.solana.com');
    console.log(`Using RPC URL: ${rpcUrl} (${useDevnet ? 'devnet' : 'mainnet'})`);
    
    // Create Solana connection
    const connection = new Connection(rpcUrl);
    
    const results = [];
    
    // Update the USDC_RECEIVER_ADDRESS
    if (addresses.usdc_address) {
      console.log("Updating USDC_RECEIVER_ADDRESS");
      try {
        // Edge functions can't directly update secrets, so we log what would be updated
        console.log(`Would update USDC_RECEIVER_ADDRESS to: ${addresses.usdc_address}`);
        
        // Log the current address if available
        const currentUsdcAddress = Deno.env.get('USDC_RECEIVER_ADDRESS');
        console.log(`Current USDC_RECEIVER_ADDRESS: ${currentUsdcAddress || 'not set'}`);
        
        // Log the USDC mint address
        const usdcMintAddress = Deno.env.get('USDC_MINT_ADDRESS') || OFFICIAL_MINT_ADDRESSES.USDC;
        console.log(`Current USDC_MINT_ADDRESS: ${usdcMintAddress}`);
        console.log(`Official USDC_MINT_ADDRESS: ${OFFICIAL_MINT_ADDRESSES.USDC}`);
        
        // Check if the wallet has an associated token account for USDC
        if (addresses.usdc_address) {
          console.log("Checking if wallet has an associated token account for USDC...");
          const hasTokenAccount = await checkAssociatedTokenAccount(
            connection, 
            addresses.usdc_address, 
            usdcMintAddress
          );
          
          if (!hasTokenAccount) {
            console.log("WARNING: No USDC associated token account found for this wallet. " +
                      "Users will not be able to send USDC to this address until a token account is created.");
          }
        }
        
        results.push({
          key: "USDC_RECEIVER_ADDRESS",
          success: true,
          message: "Logged for manual update"
        });
      } catch (error) {
        console.error("Error updating USDC_RECEIVER_ADDRESS:", error);
        results.push({
          key: "USDC_RECEIVER_ADDRESS",
          success: false,
          error: error.message
        });
      }
    }
    
    // Update the USDT_RECEIVER_ADDRESS
    if (addresses.usdt_address) {
      console.log("Updating USDT_RECEIVER_ADDRESS");
      try {
        // Edge functions can't directly update secrets, so we log what would be updated
        console.log(`Would update USDT_RECEIVER_ADDRESS to: ${addresses.usdt_address}`);
        
        // Log the current address if available
        const currentUsdtAddress = Deno.env.get('USDT_RECEIVER_ADDRESS');
        console.log(`Current USDT_RECEIVER_ADDRESS: ${currentUsdtAddress || 'not set'}`);
        
        // Log the USDT mint address
        const usdtMintAddress = Deno.env.get('USDT_MINT_ADDRESS') || OFFICIAL_MINT_ADDRESSES.USDT;
        console.log(`Current USDT_MINT_ADDRESS: ${usdtMintAddress}`);
        console.log(`Official USDT_MINT_ADDRESS: ${OFFICIAL_MINT_ADDRESSES.USDT}`);
        
        // Check if the wallet has an associated token account for USDT
        if (addresses.usdt_address) {
          console.log("Checking if wallet has an associated token account for USDT...");
          const hasTokenAccount = await checkAssociatedTokenAccount(
            connection, 
            addresses.usdt_address, 
            usdtMintAddress
          );
          
          if (!hasTokenAccount) {
            console.log("WARNING: No USDT associated token account found for this wallet. " +
                      "Users will not be able to send USDT to this address until a token account is created.");
          }
        }
        
        results.push({
          key: "USDT_RECEIVER_ADDRESS",
          success: true,
          message: "Logged for manual update"
        });
      } catch (error) {
        console.error("Error updating USDT_RECEIVER_ADDRESS:", error);
        results.push({
          key: "USDT_RECEIVER_ADDRESS",
          success: false,
          error: error.message
        });
      }
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        message: "Secret update requests logged. Please check function logs and update the secrets manually.",
        details: results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("Error updating secrets:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || "Unknown error occurred" 
      }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
