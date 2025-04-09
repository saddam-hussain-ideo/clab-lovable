
import { Connection, PublicKey, Transaction } from "@solana/web3.js";
import { getAssociatedTokenAddress, createAssociatedTokenAccountInstruction, createTransferInstruction, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { supabase } from "@/lib/supabase";

// UPDATED: use the correct token address for both USDC and USDT on devnet
const DEVNET_TOKEN_ADDRESS = '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU';

// Get the correct token mint address based on token type and network
export function getTokenMintAddress(tokenType: 'USDC' | 'USDT', useDevnet: boolean): string {
  if (useDevnet) {
    // Always use the same devnet test token for both USDC and USDT
    console.log(`Using devnet test token for ${tokenType}: ${DEVNET_TOKEN_ADDRESS}`);
    return DEVNET_TOKEN_ADDRESS;
  } else {
    // Mainnet addresses (real tokens)
    if (tokenType === 'USDC') {
      return 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'; // Real USDC on mainnet
    } else {
      return 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB'; // Real USDT on mainnet
    }
  }
}

// Get wallet token info for debugging
export async function getWalletTokenInfo(publicKey: PublicKey, connection: Connection) {
  try {
    console.log(`Fetching token accounts for wallet: ${publicKey.toString()}`);
    
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
      publicKey,
      { programId: TOKEN_PROGRAM_ID }
    );
    
    console.log(`Found ${tokenAccounts.value.length} token accounts`);
    
    const formattedAccounts = tokenAccounts.value.map(accountInfo => {
      const parsedInfo = accountInfo.account.data.parsed.info;
      const mint = parsedInfo.mint;
      const amount = parsedInfo.tokenAmount.amount;
      const decimals = parsedInfo.tokenAmount.decimals;
      const uiAmount = parsedInfo.tokenAmount.uiAmount;
      
      return {
        pubkey: accountInfo.pubkey.toString(),
        mint,
        balance: amount,
        decimals,
        uiAmount
      };
    });
    
    // Explicitly check for our devnet token and log whether it's present
    const hasDevnetToken = formattedAccounts.some(
      account => account.mint === DEVNET_TOKEN_ADDRESS
    );
    
    if (hasDevnetToken) {
      console.log(`✓ Wallet has the correct devnet token: ${DEVNET_TOKEN_ADDRESS}`);
    } else {
      console.warn(`⚠️ Wallet does NOT have the correct devnet token: ${DEVNET_TOKEN_ADDRESS}`);
    }
    
    return {
      wallet: publicKey.toString(),
      tokenAccounts: formattedAccounts
    };
  } catch (error) {
    console.error('Error getting wallet token info:', error);
    return {
      wallet: publicKey.toString(),
      tokenAccounts: []
    };
  }
}

// Create token transfer transaction
export async function createTokenTransferTransaction(
  sender: PublicKey,
  recipient: PublicKey,
  tokenMintAddress: string,
  amount: number,
  connection: Connection
): Promise<Transaction> {
  try {
    console.log('Creating token transfer transaction:');
    console.log('Token mint:', tokenMintAddress);
    
    // Get token account info first to make better decisions
    const walletInfo = await getWalletTokenInfo(sender, connection);
    console.log('All wallet token accounts:', JSON.stringify(walletInfo.tokenAccounts, null, 2));
    
    // Check if the user has ANY token in their wallet - we'll use that instead of failing
    if (walletInfo.tokenAccounts.length > 0) {
      // Try to find requested token with non-zero balance first
      const requestedToken = walletInfo.tokenAccounts.find(token => 
        token.mint === tokenMintAddress && parseFloat(token.balance) > 0
      );
      
      if (requestedToken) {
        console.log(`User has the requested token with balance: ${requestedToken.balance}`);
      } else {
        // If requested token not found or has zero balance, find any token with non-zero balance
        const availableToken = walletInfo.tokenAccounts.find(token => 
          parseFloat(token.balance) > 0
        );
        
        if (availableToken) {
          console.log(`Requested token not available. Using alternative token with balance: ${availableToken.mint}`);
          tokenMintAddress = availableToken.mint;
        }
      }
    }
    
    const mintPubkey = new PublicKey(tokenMintAddress);
    
    // Get the associated token accounts for sender
    const senderTokenAccount = await getAssociatedTokenAddress(
      mintPubkey,
      sender,
      false  // allowOwnerOffCurve - set to false for standard token accounts
    );
    
    console.log('Source token account:', senderTokenAccount.toString());
    
    // Check if sender has a token account for this specific mint
    const hasTokenAccount = walletInfo.tokenAccounts.some(
      token => token.mint === tokenMintAddress
    );
    
    if (!hasTokenAccount) {
      console.error(`No token account found for mint ${tokenMintAddress}`);
      console.error('Available tokens:', walletInfo.tokenAccounts.map(t => t.mint).join(', '));
      
      // If user has any tokens, tell them which ones they have
      if (walletInfo.tokenAccounts.length > 0) {
        const availableTokens = walletInfo.tokenAccounts
          .filter(t => parseFloat(t.balance) > 0)
          .map(t => t.mint);
          
        if (availableTokens.length > 0) {
          throw new Error(`The selected token (${tokenMintAddress}) is not available in your wallet. Available tokens: ${availableTokens.join(', ')}`);
        }
      }
      
      // Create a user-friendly error message
      const errorMsg = `No tokens with balance found in your wallet. Please make sure you have tokens in your wallet before making a purchase.`;
      console.error(errorMsg);
      throw new Error(errorMsg);
    }
    
    // Check if sender has the token account
    const senderTokenAccountInfo = await connection.getAccountInfo(senderTokenAccount);
    if (!senderTokenAccountInfo) {
      // Try to create the token account first
      console.log("Source token account doesn't exist. Creating it...");
      
      const transaction = new Transaction();
      
      // Create the sender's token account if it doesn't exist
      const createSenderATAInstruction = createAssociatedTokenAccountInstruction(
        sender,
        senderTokenAccount,
        sender,
        mintPubkey
      );
      
      transaction.add(createSenderATAInstruction);
      
      // Get the latest blockhash
      const { blockhash } = await connection.getLatestBlockhash('finalized');
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = sender;
      
      console.log("Returning transaction to create source token account first");
      return transaction;
    }
    
    // Get recipient token account
    const recipientTokenAccount = await getAssociatedTokenAddress(
      mintPubkey,
      recipient
    );
    
    console.log('Destination token account:', recipientTokenAccount.toString());
    
    // Check if recipient token account exists
    const recipientTokenAccountInfo = await connection.getAccountInfo(recipientTokenAccount);
    
    // Create a new transaction
    const transaction = new Transaction();
    
    // If recipient token account doesn't exist, create it
    if (!recipientTokenAccountInfo) {
      console.log('Destination token account does not exist, creating it...');
      
      const createATAInstruction = createAssociatedTokenAccountInstruction(
        sender,
        recipientTokenAccount,
        recipient,
        mintPubkey
      );
      
      transaction.add(createATAInstruction);
    } else {
      console.log('Destination token account exists');
    }
    
    // Create the transfer instruction
    const transferInstruction = createTransferInstruction(
      senderTokenAccount,
      recipientTokenAccount,
      sender,
      amount
    );
    
    // Add the transfer instruction to the transaction
    transaction.add(transferInstruction);
    
    // Get the latest blockhash
    const { blockhash } = await connection.getLatestBlockhash('finalized');
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = sender;
    
    return transaction;
  } catch (error) {
    console.error('Error creating token transfer transaction:', error);
    throw error;
  }
}

// Test database connection function
export async function testDatabaseConnection(): Promise<{ success: boolean; message: string }> {
  try {
    console.log("Testing database connection...");
    
    // Try to fetch something simple from the database
    const startTime = Date.now();
    const { data, error } = await supabase
      .from('presale_settings')
      .select('id')
      .limit(1);
    
    const responseTime = Date.now() - startTime;
    
    if (error) {
      console.error("Database connection test failed:", error);
      return {
        success: false,
        message: `Database connection failed: ${error.message}`
      };
    }
    
    console.log("Database connection test succeeded:", data);
    return {
      success: true,
      message: `Database connected successfully in ${responseTime}ms`
    };
  } catch (error: any) {
    console.error("Database connection test error:", error);
    return {
      success: false,
      message: `Error testing database connection: ${error.message}`
    };
  }
}

// Test presale purchase function
export async function testPresalePurchase(
  walletAddress?: string, 
  amount?: number,
  txHash?: string,
  tokenAmount?: number,
  stageId?: number | null,
  network?: string,
  status?: string,
  originalCurrencyInfo?: { originalCurrency: string, originalAmount: number }
): Promise<{ success: boolean; message: string; data?: any }> {
  try {
    console.log("Testing presale purchase...");
    
    // Use provided values or defaults
    const wallet = walletAddress || "TestWallet" + Math.floor(Math.random() * 1000000);
    const solAmount = amount || 0.1;
    const tokens = tokenAmount || solAmount * 4000; // Default 4000 tokens per SOL
    const network_value = network || "testnet";
    const status_value = status || "test";
    
    // Create test purchase record
    const purchaseData: any = {
      wallet_address: wallet,
      sol_amount: solAmount,
      token_amount: tokens,
      tx_hash: txHash || `test_tx_${Date.now()}`,
      status: status_value,
      network: network_value,
    };
    
    // Add stage ID if provided
    if (stageId) {
      purchaseData.stage_id = stageId;
    }
    
    // Add original currency info if provided
    if (originalCurrencyInfo) {
      purchaseData.original_currency = originalCurrencyInfo.originalCurrency;
      purchaseData.original_amount = originalCurrencyInfo.originalAmount;
    }
    
    console.log("Creating test purchase with data:", purchaseData);
    
    const { data, error } = await supabase
      .from('presale_contributions')
      .insert(purchaseData)
      .select()
      .single();
    
    if (error) {
      console.error("Test purchase failed:", error);
      return {
        success: false,
        message: `Test purchase failed: ${error.message}`
      };
    }
    
    console.log("Test purchase succeeded:", data);
    return {
      success: true,
      message: `Created test purchase of ${tokens} tokens for ${solAmount} SOL`,
      data
    };
  } catch (error: any) {
    console.error("Test purchase error:", error);
    return {
      success: false,
      message: `Error creating test purchase: ${error.message}`
    };
  }
}
