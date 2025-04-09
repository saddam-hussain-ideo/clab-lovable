
import { 
  Connection, 
  PublicKey, 
  Transaction, 
  sendAndConfirmTransaction, 
  Keypair,
  SystemProgram,
  LAMPORTS_PER_SOL
} from '@solana/web3.js';
import { 
  createAssociatedTokenAccountInstruction, 
  getAssociatedTokenAddress,
  createMintToInstruction,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAccount,
  MINT_SIZE,
  createInitializeMintInstruction,
  getMint,
  createTransferInstruction
} from '@solana/spl-token';
import { toast } from 'sonner';
import { getSolanaConnection, getFreshBlockhash } from '@/utils/rpc/rpcUtils';
import { withRetry } from '@/utils/retry/retryUtils';

/**
 * Check if the wallet is the mint authority for a token
 * @param wallet Connected wallet
 * @param tokenMintAddress Token mint address
 * @returns Whether the wallet is the mint authority
 */
export const checkMintAuthority = async (
  wallet: any,
  tokenMintAddress: string
): Promise<{ isMintAuthority: boolean; error?: string }> => {
  try {
    if (!wallet || !wallet.publicKey) {
      throw new Error("Wallet not connected");
    }

    const network = localStorage.getItem('activeNetwork') === 'mainnet' ? 'mainnet-beta' : 'devnet';
    const connection = await getSolanaConnection(network);
    
    // Log info for debugging
    console.log(`Checking mint authority for token ${tokenMintAddress}`);
    console.log(`Using wallet: ${wallet.publicKey.toString()}`);
    console.log(`Network: ${network}`);
    
    // Get the mint account info
    const mintInfo = await connection.getParsedAccountInfo(new PublicKey(tokenMintAddress));
    
    if (!mintInfo || !mintInfo.value) {
      throw new Error("Token mint not found");
    }
    
    // The data is encoded, we need to parse it
    const parsedData = (mintInfo.value.data as any).parsed;
    const info = parsedData.info;
    
    if (!info || !info.mintAuthority) {
      throw new Error("Invalid token mint data or no mint authority set");
    }
    
    // Check if the wallet is the mint authority
    const mintAuthority = info.mintAuthority;
    const isMintAuthority = mintAuthority === wallet.publicKey.toString();
    
    console.log(`Mint authority is: ${mintAuthority}`);
    console.log(`Connected wallet is: ${wallet.publicKey.toString()}`);
    console.log(`Is mint authority match: ${isMintAuthority}`);
    
    return { isMintAuthority };
  } catch (error: any) {
    console.error("Error checking mint authority:", error);
    return { 
      isMintAuthority: false, 
      error: error.message || "Failed to check mint authority" 
    };
  }
};

/**
 * Get token decimals from mint info
 * @param connection Solana connection
 * @param tokenMintAddress Token mint address
 * @returns Token decimals
 */
export const getTokenDecimals = async (
  connection: Connection,
  tokenMintAddress: string
): Promise<number> => {
  try {
    const mintInfo = await connection.getParsedAccountInfo(new PublicKey(tokenMintAddress));
    
    if (!mintInfo || !mintInfo.value) {
      throw new Error("Token mint not found");
    }
    
    const parsedData = (mintInfo.value.data as any).parsed;
    const info = parsedData.info;
    
    if (!info || info.decimals === undefined) {
      throw new Error("Invalid token mint data");
    }
    
    return info.decimals;
  } catch (error) {
    console.error("Error getting token decimals:", error);
    throw error;
  }
};

/**
 * Mint tokens to an associated token account
 * @param wallet Connected wallet (must be mint authority)
 * @param tokenMintAddress Token mint address
 * @param amount Amount of tokens to mint (in UI format, e.g. 100 for 100 tokens)
 * @param destinationAddress Destination wallet address (optional, defaults to wallet's address)
 * @returns Transaction result
 */
export const mintTokensToATA = async (
  wallet: any,
  tokenMintAddress: string,
  amount: number,
  destinationAddress?: string
): Promise<{ success: boolean; txSignature?: string; error?: string }> => {
  try {
    return await withRetry(async () => {
      console.log(`Minting ${amount} tokens from mint address: ${tokenMintAddress}`);
      
      if (!wallet || !wallet.publicKey) {
        throw new Error("Wallet not connected");
      }
      
      // Check if the wallet is the mint authority
      const { isMintAuthority, error: authorityError } = await checkMintAuthority(wallet, tokenMintAddress);
      
      if (!isMintAuthority) {
        throw new Error(authorityError || "Connected wallet is not the mint authority for this token");
      }
      
      const network = localStorage.getItem('activeNetwork') === 'mainnet' ? 'mainnet-beta' : 'devnet';
      const connection = await getSolanaConnection(network);
      
      console.log(`Connected to Solana ${network}`);
      
      try {
        // Validate the mint public key format
        const mintPublicKey = new PublicKey(tokenMintAddress);
        console.log(`Valid mint address format: ${mintPublicKey.toString()}`);
        
        // Further validate that it's a valid SPL token by trying to get mint data
        const mintInfo = await getMint(connection, mintPublicKey);
        console.log(`Valid SPL token mint with ${mintInfo.decimals} decimals`);
      } catch (e: any) {
        console.error("Mint validation error:", e);
        throw new Error(`Invalid token mint: ${e.message}`);
      }
      
      // Get token decimals
      const decimals = await getTokenDecimals(connection, tokenMintAddress);
      console.log(`Token has ${decimals} decimals`);
      
      // Calculate the amount in raw units (accounting for decimals)
      const rawAmount = Math.floor(amount * Math.pow(10, decimals));
      console.log(`Raw amount to mint: ${rawAmount}`);
      
      // Make sure the transaction has enough funds for fees
      // Check if the wallet has enough SOL for transaction fees
      const minFeeRequired = 0.00001 * LAMPORTS_PER_SOL; // ~0.00001 SOL minimum for transaction
      const walletBalance = await connection.getBalance(wallet.publicKey);
      if (walletBalance < minFeeRequired) {
        throw new Error(`Insufficient SOL balance for transaction fees. Need at least 0.00001 SOL.`);
      }
      
      // Get a fresh blockhash
      const blockhash = await getFreshBlockhash(network);
      console.log(`Got fresh blockhash: ${blockhash}`);
      
      // Create a new transaction
      const transaction = new Transaction({
        feePayer: wallet.publicKey,
        recentBlockhash: blockhash
      });
      
      // Determine the destination wallet address
      const destinationWallet = destinationAddress 
        ? new PublicKey(destinationAddress) 
        : wallet.publicKey;
      
      console.log(`Destination wallet: ${destinationWallet.toString()}`);
      
      // Get the associated token account address for the destination
      const destinationTokenAccount = await getAssociatedTokenAddress(
        new PublicKey(tokenMintAddress),
        destinationWallet,
        false,  // Don't allow the owner account to be off curve
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );
      
      console.log(`Destination token account: ${destinationTokenAccount.toString()}`);
      
      // Check if the destination token account exists
      const tokenAccountInfo = await connection.getAccountInfo(destinationTokenAccount);
      
      // If the token account doesn't exist, create it
      if (!tokenAccountInfo) {
        console.log(`Creating token account for destination: ${destinationWallet.toString()}`);
        
        transaction.add(
          createAssociatedTokenAccountInstruction(
            wallet.publicKey,                    // payer
            destinationTokenAccount,             // associatedToken
            destinationWallet,                   // owner
            new PublicKey(tokenMintAddress),     // mint
            TOKEN_PROGRAM_ID,
            ASSOCIATED_TOKEN_PROGRAM_ID
          )
        );
      }
      
      // Add the mint instruction to the transaction
      transaction.add(
        createMintToInstruction(
          new PublicKey(tokenMintAddress),     // mint
          destinationTokenAccount,             // destination
          wallet.publicKey,                    // authority
          rawAmount,                          // amount
          [],                                 // multiSigners
          TOKEN_PROGRAM_ID
        )
      );
      
      // Pre-simulate the transaction to check for errors
      console.log("Simulating transaction before sending...");
      try {
        const simulation = await connection.simulateTransaction(transaction);
        if (simulation.value.err) {
          console.error("Transaction simulation failed:", simulation.value.err);
          throw new Error(`Transaction simulation failed: ${JSON.stringify(simulation.value.err)}`);
        }
        console.log("Simulation successful, proceeding with transaction");
      } catch (simError: any) {
        console.error("Error simulating transaction:", simError);
        throw new Error(`Error during transaction simulation: ${simError.message || "Unknown simulation error"}`);
      }
      
      // Sign and send the transaction
      try {
        let signature: string;
        
        if (wallet.signAndSendTransaction) {
          console.log("Using wallet.signAndSendTransaction method");
          signature = await wallet.signAndSendTransaction(transaction);
        } else if (wallet.signTransaction) {
          console.log("Using wallet.signTransaction method");
          // Sign the transaction
          const signedTransaction = await wallet.signTransaction(transaction);
          // Send the signed transaction
          signature = await connection.sendRawTransaction(signedTransaction.serialize());
        } else {
          throw new Error("Wallet doesn't support transaction signing");
        }
        
        console.log('Mint transaction sent with signature:', signature);
        
        // Wait for confirmation
        const confirmation = await connection.confirmTransaction(signature, 'confirmed');
        console.log('Mint transaction confirmed:', confirmation);
        
        return {
          success: true,
          txSignature: signature
        };
      } catch (error: any) {
        console.error('Error sending mint transaction:', error);
        
        // Provide more detailed error message based on the error
        let errorMessage = "Failed to mint tokens";
        if (error.message && error.message.includes("IncorrectProgramId")) {
          errorMessage = "Transaction failed: Incorrect Program ID. This may be due to using an invalid token mint address or the token program expecting different parameters.";
        } else if (error.message && error.message.includes("Transaction simulation failed")) {
          errorMessage = "Transaction simulation failed. The wallet may not have permission to mint tokens.";
        } else if (error.message && error.message.includes("insufficient funds")) {
          errorMessage = "Insufficient funds for transaction. Make sure you have enough SOL to pay for network fees.";
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        throw new Error(errorMessage);
      }
    }, { context: 'Token Minting', maxRetries: 3 });
  } catch (error: any) {
    console.error("Failed to mint tokens after multiple attempts:", error);
    return {
      success: false,
      error: error?.message || "Failed to mint tokens after multiple attempts"
    };
  }
};

/**
 * Distribute tokens to multiple recipients
 * @param wallet Connected wallet (must have tokens)
 * @param tokenMintAddress Token mint address
 * @param recipients Array of recipients with address and amount
 * @returns Transaction result
 */
export const distributeTokensToRecipients = async (
  wallet: any,
  tokenMintAddress: string,
  recipients: { address: string; amount: number }[]
): Promise<{ success: boolean; txSignature?: string; error?: string }> => {
  try {
    return await withRetry(async () => {
      console.log(`Distributing tokens to ${recipients.length} recipients from mint: ${tokenMintAddress}`);
      
      if (!wallet || !wallet.publicKey) {
        throw new Error("Wallet not connected");
      }
      
      if (recipients.length === 0) {
        throw new Error("No recipients specified");
      }
      
      const network = localStorage.getItem('activeNetwork') === 'mainnet' ? 'mainnet-beta' : 'devnet';
      const connection = await getSolanaConnection(network);
      
      // Get token decimals for proper amount calculation
      const decimals = await getTokenDecimals(connection, tokenMintAddress);
      
      // Get a fresh blockhash
      const blockhash = await getFreshBlockhash(network);
      
      // Create a new transaction
      const transaction = new Transaction({
        feePayer: wallet.publicKey,
        recentBlockhash: blockhash
      });
      
      // Get the source token account (the wallet's ATA)
      const sourceTokenAccount = await getAssociatedTokenAddress(
        new PublicKey(tokenMintAddress),
        wallet.publicKey,
        false, // Don't allow the owner account to be off curve
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );
      
      // Ensure the source token account exists
      const sourceAccountInfo = await connection.getAccountInfo(sourceTokenAccount);
      if (!sourceAccountInfo) {
        throw new Error("You don't have a token account for this token. Please mint tokens to your wallet first.");
      }
      
      // Add instructions for each recipient
      for (const recipient of recipients) {
        // Calculate the amount in raw units (accounting for decimals)
        const rawAmount = Math.floor(recipient.amount * Math.pow(10, decimals));
        
        // Get the destination token account
        const destinationWallet = new PublicKey(recipient.address);
        const destinationTokenAccount = await getAssociatedTokenAddress(
          new PublicKey(tokenMintAddress),
          destinationWallet,
          false, // Don't allow the owner account to be off curve
          TOKEN_PROGRAM_ID,
          ASSOCIATED_TOKEN_PROGRAM_ID
        );
        
        // Check if the destination token account exists
        const destAccountInfo = await connection.getAccountInfo(destinationTokenAccount);
        
        // If the token account doesn't exist, create it
        if (!destAccountInfo) {
          console.log(`Creating token account for recipient: ${destinationWallet.toString()}`);
          
          transaction.add(
            createAssociatedTokenAccountInstruction(
              wallet.publicKey,
              destinationTokenAccount,
              destinationWallet,
              new PublicKey(tokenMintAddress),
              TOKEN_PROGRAM_ID,
              ASSOCIATED_TOKEN_PROGRAM_ID
            )
          );
        }
        
        // Add transfer instruction
        transaction.add(
          createTransferInstruction(
            sourceTokenAccount,
            destinationTokenAccount,
            wallet.publicKey,
            rawAmount,
            [],
            TOKEN_PROGRAM_ID
          )
        );
      }
      
      // If the transaction is too large, throw an error
      if (transaction.instructions.length > 7) {
        throw new Error("Transaction too large. Please distribute to fewer recipients at once.");
      }
      
      // Sign and send the transaction
      try {
        let signature: string;
        
        if (wallet.signAndSendTransaction) {
          console.log("Using wallet.signAndSendTransaction method");
          signature = await wallet.signAndSendTransaction(transaction);
        } else if (wallet.signTransaction) {
          console.log("Using wallet.signTransaction method");
          // Sign the transaction
          const signedTransaction = await wallet.signTransaction(transaction);
          // Send the signed transaction
          signature = await connection.sendRawTransaction(signedTransaction.serialize());
        } else {
          throw new Error("Wallet doesn't support transaction signing");
        }
        
        console.log('Distribution transaction sent with signature:', signature);
        
        // Wait for confirmation
        const confirmation = await connection.confirmTransaction(signature, 'confirmed');
        console.log('Distribution transaction confirmed:', confirmation);
        
        return {
          success: true,
          txSignature: signature
        };
      } catch (error: any) {
        console.error('Error sending distribution transaction:', error);
        throw error;
      }
    }, { context: 'Token Distribution', maxRetries: 3 });
  } catch (error: any) {
    console.error("Failed to distribute tokens after multiple attempts:", error);
    return {
      success: false,
      error: error?.message || "Failed to distribute tokens after multiple attempts"
    };
  }
};
