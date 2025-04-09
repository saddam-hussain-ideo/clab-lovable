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
  createTransferInstruction,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID
} from '@solana/spl-token';
import { 
  getSolanaConnection as getRpcSolanaConnection,
  getCustomRpcUrl, 
  getFallbackRpcUrl, 
  markRpcEndpointFailed, 
  getFreshBlockhash 
} from '@/utils/rpc/rpcUtils';
import { withRetry } from '@/utils/retry/retryUtils';
import { toast } from 'sonner';

/**
 * Check the admin wallet's token balance
 * With enhanced RPC handling and retries
 */
export const checkAdminTokenBalance = async (
  wallet: any,
  tokenMintAddress: string
): Promise<{ success: boolean; balance?: number; error?: string }> => {
  try {
    return await withRetry(async () => {
      console.log(`Checking admin token balance for mint: ${tokenMintAddress}`);
      
      if (!wallet || !wallet.publicKey) {
        throw new Error("Wallet not connected");
      }
      
      const network = localStorage.getItem('activeNetwork') === 'mainnet' ? 'mainnet-beta' : 'devnet';
      const connection = await getSolanaConnection(network);
      
      // Get the associated token account for the admin wallet
      const associatedTokenAddress = await getAssociatedTokenAddress(
        new PublicKey(tokenMintAddress),
        wallet.publicKey
      );
      
      try {
        // Try to fetch the token account info
        const tokenAccountInfo = await connection.getTokenAccountBalance(associatedTokenAddress);
        const balance = Number(tokenAccountInfo.value.uiAmount);
        
        console.log(`Admin token balance: ${balance}`);
        
        return {
          success: true,
          balance
        };
      } catch (error) {
        // If the token account doesn't exist, return 0 balance
        console.log(`Token account not found, balance is 0`);
        return {
          success: true,
          balance: 0
        };
      }
    }, { context: 'Admin Token Balance' });
  } catch (error: any) {
    console.error('Error checking admin token balance after retries:', error);
    return {
      success: false,
      error: error?.message || "Failed to check token balance after multiple attempts"
    };
  }
};

/**
 * Get token information
 * With enhanced RPC handling and retries
 */
export const getTokenInfo = async (
  tokenMintAddress: string
): Promise<{
  success: boolean;
  mintAddress?: string;
  name?: string;
  symbol?: string;
  totalSupply?: number;
  decimals?: number;
  error?: string;
}> => {
  try {
    return await withRetry(async () => {
      console.log(`Getting token info for mint: ${tokenMintAddress}`);
      
      const network = localStorage.getItem('activeNetwork') === 'mainnet' ? 'mainnet-beta' : 'devnet';
      const connection = await getSolanaConnection(network);
      
      // Get the token mint info
      const mintInfo = await connection.getParsedAccountInfo(new PublicKey(tokenMintAddress));
      
      if (!mintInfo || !mintInfo.value || !mintInfo.value.data) {
        throw new Error("Token mint not found");
      }
      
      // The data is encoded, we need to parse it
      const parsedData = (mintInfo.value.data as any).parsed;
      const info = parsedData.info;
      
      if (!info) {
        throw new Error("Invalid token mint data");
      }
      
      // Extract the token data
      const decimals = info.decimals;
      const totalSupply = Number(info.supply) / Math.pow(10, decimals);
      
      // In a real implementation, you would fetch token metadata from on-chain data
      // For now, we'll use placeholder values for name and symbol
      const name = `Token ${tokenMintAddress.substring(0, 4)}...`;
      const symbol = "TOKEN";
      
      return {
        success: true,
        mintAddress: tokenMintAddress,
        name,
        symbol,
        totalSupply,
        decimals
      };
    }, { context: 'Token Info' });
  } catch (error: any) {
    console.error('Error getting token info after retries:', error);
    
    return {
      success: false,
      error: error?.message || "Failed to get token information"
    };
  }
};

/**
 * Verify that the wallet owns the token mint
 */
export const verifyTokenMintOwnership = async (
  wallet: any,
  tokenMintAddress: string
): Promise<{ success: boolean; isOwner: boolean; error?: string }> => {
  try {
    return await withRetry(async () => {
      console.log(`Verifying token mint ownership for: ${tokenMintAddress}`);
      
      if (!wallet || !wallet.publicKey) {
        throw new Error("Wallet not connected");
      }
      
      const network = localStorage.getItem('activeNetwork') === 'mainnet' ? 'mainnet-beta' : 'devnet';
      const connection = await getSolanaConnection(network);
      
      try {
        // Get the mint info
        const mintInfo = await connection.getParsedAccountInfo(new PublicKey(tokenMintAddress));
        
        if (!mintInfo || !mintInfo.value) {
          throw new Error("Token mint not found");
        }
        
        // The data is encoded, we need to parse it
        const parsedData = (mintInfo.value.data as any).parsed;
        const info = parsedData.info;
        
        if (!info) {
          throw new Error("Invalid token mint data");
        }
        
        // Check if the mint authority is the connected wallet
        const mintAuthority = info.mintAuthority;
        const isOwner = mintAuthority === wallet.publicKey.toString();
        
        return {
          success: true,
          isOwner
        };
      } catch (error) {
        console.error("Error verifying token mint ownership:", error);
        return {
          success: false,
          isOwner: false,
          error: "Failed to verify token mint ownership"
        };
      }
    }, { context: 'Token Mint Ownership' });
  } catch (error: any) {
    console.error('Error verifying token mint ownership after retries:', error);
    return {
      success: false,
      isOwner: false,
      error: error?.message || "Failed to verify token mint ownership after multiple attempts"
    };
  }
};

/**
 * Distribute presale tokens to wallets
 * With enhanced RPC handling, retries and fallbacks
 */
export const distributePresaleTokens = async (
  wallet: any,
  tokenMintAddress: string,
  recipients: { address: string; amount: number }[]
): Promise<{ success: boolean; error?: string; txSignature?: string; processedAddresses?: string[] }> => {
  const network = localStorage.getItem('activeNetwork') === 'mainnet' ? 'mainnet-beta' : 'devnet';
  
  try {
    return await withRetry(async () => {
      console.log(`Distributing presale tokens from mint address: ${tokenMintAddress} to ${recipients.length} recipients`);
      
      if (!wallet) {
        throw new Error("No wallet provided");
      }
      
      if (!wallet.publicKey) {
        throw new Error("Wallet not connected");
      }
      
      // Check for signAndSendTransaction or signTransaction method
      if (!wallet.signAndSendTransaction && !wallet.signTransaction) {
        throw new Error("Wallet doesn't support transaction signing");
      }
      
      // Log wallet details for debugging
      console.log("Using wallet for token distribution:", {
        publicKey: wallet.publicKey.toString(),
        signAndSendTransaction: !!wallet.signAndSendTransaction,
        signTransaction: !!wallet.signTransaction,
        connected: wallet.connected || wallet.isConnected
      });
      
      // Validate recipients
      if (!recipients || recipients.length === 0) {
        throw new Error("No recipients provided");
      }
      
      // First try with custom RPC URL
      let currentRpcUrl = getCustomRpcUrl(network);
      
      // If no custom URL, try with fallback
      if (!currentRpcUrl) {
        // Skip failed endpoints on subsequent retries
        currentRpcUrl = getFallbackRpcUrl(network, true);
      }
      
      console.log(`Using RPC URL: ${currentRpcUrl}`);
      
      // Create a connection to the Solana network
      const connection = new Connection(currentRpcUrl, 'confirmed');
      
      // Validate token mint address
      try {
        if (!tokenMintAddress) {
          throw new Error("No token mint address provided. Please select a token from your wallet.");
        }
        
        console.log("Validating token mint address:", tokenMintAddress);
        const publicKey = new PublicKey(tokenMintAddress);
        
        // Get the token mint info to check decimals
        const mintInfo = await connection.getParsedAccountInfo(publicKey);
        if (!mintInfo || !mintInfo.value) {
          throw new Error(`Token mint not found. The address "${tokenMintAddress}" doesn't exist or isn't a valid token.`);
        }
        
        if (!mintInfo.value.data) {
          throw new Error("Invalid token data structure");
        }
        
        // Check if it's actually a token mint
        try {
          const parsedData = (mintInfo.value.data as any).parsed;
          if (!parsedData || !parsedData.type || parsedData.type !== 'mint') {
            throw new Error("The provided address is not a token mint");
          }
          
          const info = parsedData.info;
          if (!info || info.decimals === undefined) {
            throw new Error("Invalid token mint data structure");
          }
          
          console.log("Token validation successful:", {
            tokenMint: tokenMintAddress,
            decimals: info.decimals
          });
        } catch (parseError) {
          console.error("Error parsing token mint data:", parseError);
          throw new Error("The provided address is not a valid token mint");
        }
      } catch (validationError: any) {
        console.error("Token validation error:", validationError);
        throw new Error(`Token validation failed: ${validationError.message}`);
      }
      
      // Get the token mint info to check decimals (we already validated it exists)
      const mintInfo = await connection.getParsedAccountInfo(new PublicKey(tokenMintAddress));
      const parsedData = (mintInfo.value.data as any).parsed;
      const info = parsedData.info;
      const decimals = info.decimals;
      
      // Create a transaction to transfer tokens to each recipient
      const transaction = new Transaction();
      
      // Get a fresh blockhash
      const blockhash = await getFreshBlockhash(network);
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = wallet.publicKey;
      
      // Get the source token account
      const sourceTokenAccount = await getAssociatedTokenAddress(
        new PublicKey(tokenMintAddress),
        wallet.publicKey
      );
      
      // Check if the source token account exists and create it if it doesn't
      let sourceAccountExists = false;
      try {
        const sourceAccountInfo = await connection.getAccountInfo(sourceTokenAccount);
        sourceAccountExists = !!sourceAccountInfo;
      } catch (error) {
        console.log("Error checking source account, assuming it doesn't exist", error);
        sourceAccountExists = false;
      }
      
      // If source token account doesn't exist, create it first
      if (!sourceAccountExists) {
        console.log("Creating source token account for admin wallet");
        transaction.add(
          createAssociatedTokenAccountInstruction(
            wallet.publicKey,
            sourceTokenAccount,
            wallet.publicKey,
            new PublicKey(tokenMintAddress)
          )
        );
      } else {
        // Only check balance if the account exists
        try {
          const sourceAccount = await connection.getTokenAccountBalance(sourceTokenAccount);
          const tokenBalance = Number(sourceAccount.value.amount) / Math.pow(10, sourceAccount.value.decimals);
          
          console.log(`Source token account balance: ${tokenBalance} tokens`);
          
          // Calculate total tokens needed
          const totalTokens = recipients.reduce((sum, r) => sum + r.amount, 0);
          console.log(`Total tokens to distribute: ${totalTokens}`);
          
          if (tokenBalance < totalTokens) {
            throw new Error(`Insufficient token balance. You have ${tokenBalance.toFixed(4)} tokens, but need ${totalTokens.toFixed(4)}.`);
          }
        } catch (balanceError: any) {
          if (balanceError.message && balanceError.message.includes("Insufficient token balance")) {
            throw balanceError;
          }
          console.error("Error checking source token account:", balanceError);
          
          // For testnet, proceed even if we can't check balance
          if (network !== 'devnet') {
            throw new Error("Could not verify token balance. The token may not exist in your wallet.");
          } else {
            console.log("Proceeding with distribution in testnet even without balance verification");
          }
        }
      }
      
      // Keep track of processed addresses
      const processedAddresses: string[] = [];
      
      // Add instructions for each recipient
      for (const recipient of recipients) {
        try {
          const destinationWallet = new PublicKey(recipient.address);
          
          // Calculate the amount in raw units (accounting for decimals)
          const rawAmount = Math.floor(recipient.amount * Math.pow(10, decimals));
          
          // Get or create the recipient's associated token account
          const destinationTokenAccount = await getAssociatedTokenAddress(
            new PublicKey(tokenMintAddress),
            destinationWallet
          );
          
          // Check if the recipient's token account exists
          const tokenAccountInfo = await connection.getAccountInfo(destinationTokenAccount);
          
          // If the token account doesn't exist, create it
          if (!tokenAccountInfo) {
            transaction.add(
              createAssociatedTokenAccountInstruction(
                wallet.publicKey,
                destinationTokenAccount,
                destinationWallet,
                new PublicKey(tokenMintAddress)
              )
            );
          }
          
          // Add the transfer instruction
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
          
          processedAddresses.push(recipient.address);
        } catch (error) {
          console.error(`Error adding recipient ${recipient.address} to transaction:`, error);
          // Continue with other recipients
        }
      }
      
      if (transaction.instructions.length === 0) {
        throw new Error("No valid recipients to process");
      }
      
      // Sign and send the transaction
      try {
        // Ensure we have a valid wallet
        if (!wallet.publicKey) {
          throw new Error("Wallet not connected");
        }
        
        // Handle transaction signing based on wallet capabilities
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
        
        console.log('Transaction sent with signature:', signature);
        
        // Wait for confirmation
        const confirmation = await connection.confirmTransaction(signature, 'confirmed');
        console.log('Transaction confirmed:', confirmation);
        
        return {
          success: true,
          txSignature: signature,
          processedAddresses
        };
      } catch (error: any) {
        console.error('Error sending transaction:', error);
        
        // Check if it's an RPC error and mark the endpoint as failed
        if (error.message && (
          error.message.includes('429') || 
          error.message.includes('rate limit') || 
          error.message.includes('too many requests')
        )) {
          markRpcEndpointFailed(currentRpcUrl);
        }
        
        throw error;
      }
    }, { context: 'Token Distribution', maxRetries: 3 }); // Lower retry count for testing
  } catch (error: any) {
    console.error("Failed to distribute tokens after multiple attempts:", error);
    return {
      success: false,
      error: error?.message || "Failed to distribute tokens after multiple attempts"
    };
  }
};

// Export the getSolanaConnection function that uses rpcUtils.getSolanaConnection
export const getSolanaConnection = getRpcSolanaConnection;

// Re-export the needed RPC utilities to maintain backward compatibility
export { getCustomRpcUrl, getFallbackRpcUrl, markRpcEndpointFailed, getFreshBlockhash };
