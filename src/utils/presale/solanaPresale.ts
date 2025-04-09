// Import Buffer from our central polyfill utility
import { Buffer } from '../buffer-polyfill';

// Remove redundant Buffer initialization code
console.log("Buffer polyfill status in solanaPresale:", typeof Buffer, typeof window.Buffer);

import {
  clusterApiUrl,
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
  Cluster
} from "@solana/web3.js";
import {
  createAssociatedTokenAccount,
  createInitializeMintInstruction,
  createMintToInstruction,
  getAccount,
  getAssociatedTokenAddress,
  getMint,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";

import * as mplTokenMetadata from "@metaplex-foundation/mpl-token-metadata";

import bs58 from 'bs58';

import { findContributionByWalletAddress, updateContributionStatus } from "../db/supabase";
import { trackEvent } from "../analytics";
import { getActiveNetwork } from "../wallet";
import { getClabTokenMetadata } from "../token/tokenMetadata";
import { supabase } from "@/lib/supabase";

export type Network = 'mainnet' | 'testnet';

const PRESALE_PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_PRESALE_PROGRAM_ID || "11111111111111111111111111111111"
);

export const getNetwork = async (): Promise<'devnet' | 'mainnet-beta'> => {
  try {
    const activeNetwork = getActiveNetwork();
    return activeNetwork === 'testnet' ? 'devnet' : 'mainnet-beta';
  } catch (error) {
    console.error("Error determining network:", error);
    return 'devnet';
  }
};

export const getConnection = (network: 'devnet' | 'mainnet-beta'): Connection => {
  const endpoint = clusterApiUrl(network as Cluster);
  return new Connection(endpoint, "confirmed");
};

const confirmTransaction = async (
  connection: Connection,
  signature: string
) => {
  try {
    const latestBlockhash = await connection.getLatestBlockhash();

    await connection.confirmTransaction(
      {
        signature,
        ...latestBlockhash,
      },
      "confirmed"
    );

    console.log(`Transaction ${signature} confirmed`);
    return true;
  } catch (error) {
    console.error("Error confirming transaction:", error);
    return false;
  }
};

export const airdropSolIfNeeded = async (
  connection: Connection,
  walletPublicKey: PublicKey
) => {
  const balance = await connection.getBalance(walletPublicKey);
  console.log("wallet balance:", balance);
  if (balance < 0.5 * LAMPORTS_PER_SOL) {
    console.log("Airdropping SOL...");
    const airdropSignature = await connection.requestAirdrop(
      walletPublicKey,
      2 * LAMPORTS_PER_SOL
    );
    await confirmTransaction(connection, airdropSignature);
  }
};

export const createMintAccount = async (
  connection: Connection,
  payer: Keypair
): Promise<Keypair> => {
  const mintKeypair = Keypair.generate();
  const lamportsForMint =
    await connection.getMinimumBalanceForRentExemption(82);

  const createMintAccountTransaction = new Transaction().add(
    SystemProgram.createAccount({
      fromPubkey: payer.publicKey,
      newAccountPubkey: mintKeypair.publicKey,
      space: 82,
      lamports: lamportsForMint,
      programId: TOKEN_PROGRAM_ID,
    }),
    createInitializeMintInstruction(
      mintKeypair.publicKey,
      0,
      payer.publicKey,
      payer.publicKey
    )
  );

  try {
    const signature = await connection.sendTransaction(
      createMintAccountTransaction,
      [payer, mintKeypair]
    );
    await confirmTransaction(connection, signature);
    console.log(
      `Created mint account ${mintKeypair.publicKey.toBase58()} successfully`
    );
  } catch (error) {
    console.error("Error creating mint account:", error);
    throw error;
  }

  return mintKeypair;
};

export const createTokenAccount = async (
  connection: Connection,
  payer: Keypair,
  mint: PublicKey,
  owner: PublicKey
): Promise<PublicKey> => {
  try {
    const tokenAccount = await createAssociatedTokenAccount(
      connection,
      payer,
      mint,
      owner
    );
    console.log(`Created token account ${tokenAccount.toBase58()} successfully`);
    return tokenAccount;
  } catch (error) {
    console.error("Error creating token account:", error);
    throw error;
  }
};

export const mintTokens = async (
  connection: Connection,
  payer: Keypair,
  mint: PublicKey,
  destination: PublicKey,
  amount: number
): Promise<void> => {
  try {
    const mintToInstruction = createMintToInstruction(
      mint,
      destination,
      payer.publicKey,
      amount
    );
    const transaction = new Transaction().add(mintToInstruction);

    const signature = await connection.sendTransaction(transaction, [payer]);
    await confirmTransaction(connection, signature);
    console.log(`Minted ${amount} tokens to ${destination.toBase58()} successfully`);
  } catch (error) {
    console.error("Error minting tokens:", error);
    throw error;
  }
};

export const getMetadataAddress = async (mint: PublicKey): Promise<PublicKey> => {
  const [metadataAddress] = await PublicKey.findProgramAddress(
    [
      Buffer.from("metadata"),
      new PublicKey(mplTokenMetadata.PROGRAM_ID).toBuffer(),
      mint.toBuffer(),
    ],
    new PublicKey(mplTokenMetadata.PROGRAM_ID)
  );
  return metadataAddress;
};

export const createMetadataAccount = async (
  connection: Connection,
  payer: Keypair,
  mint: PublicKey,
  metadata: any
): Promise<void> => {
  const metadataAccount = await getMetadataAddress(mint);

  const createMetadataInstruction = new TransactionInstruction({
    keys: [
      { pubkey: metadataAccount, isSigner: false, isWritable: true },
      { pubkey: mint, isSigner: false, isWritable: false },
      { pubkey: payer.publicKey, isSigner: true, isWritable: false },
      { pubkey: payer.publicKey, isSigner: true, isWritable: false },
      { pubkey: payer.publicKey, isSigner: true, isWritable: false },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    programId: new PublicKey(mplTokenMetadata.PROGRAM_ID),
    data: Buffer.from([])
  });

  const transaction = new Transaction().add(createMetadataInstruction);

  try {
    const signature = await connection.sendTransaction(transaction, [payer]);
    await confirmTransaction(connection, signature);
    console.log(
      `Created metadata account ${metadataAccount.toBase58()} successfully`
    );
  } catch (error) {
    console.error("Error creating metadata account:", error);
    throw error;
  }
};

export const updateMetadataAccount = async (
  connection: Connection,
  payer: Keypair,
  mint: PublicKey,
  newMetadata: any
): Promise<void> => {
  const metadataAccount = await getMetadataAddress(mint);

  const updateMetadataInstruction = new TransactionInstruction({
    keys: [
      { pubkey: metadataAccount, isSigner: false, isWritable: true },
      { pubkey: payer.publicKey, isSigner: true, isWritable: false },
    ],
    programId: new PublicKey(mplTokenMetadata.PROGRAM_ID),
    data: Buffer.from([])
  });

  const transaction = new Transaction().add(updateMetadataInstruction);

  try {
    const signature = await connection.sendTransaction(transaction, [payer]);
    await confirmTransaction(connection, signature);
    console.log(
      `Updated metadata account ${metadataAccount.toBase58()} successfully`
    );
  } catch (error) {
    console.error("Error updating metadata account:", error);
    throw error;
  }
};

export const transferTokens = async (
  connection: Connection,
  payer: Keypair,
  source: PublicKey,
  destination: PublicKey,
  mint: PublicKey,
  amount: number
): Promise<void> => {
  try {
    const transferInstruction = createTransferCheckedInstruction(
      source,
      destination,
      payer.publicKey,
      mint,
      amount,
      0
    );
    const transaction = new Transaction().add(transferInstruction);
    const signature = await connection.sendTransaction(transaction, [payer]);
    await confirmTransaction(connection, signature);
    console.log(
      `Transferred ${amount} tokens from ${source.toBase58()} to ${destination.toBase58()} successfully`
    );
  } catch (error) {
    console.error("Error transferring tokens:", error);
    throw error;
  }
};

export const createTransferCheckedInstruction = (
  source: PublicKey,
  destination: PublicKey,
  authority: PublicKey,
  mint: PublicKey,
  amount: number,
  decimals: number
) => {
  const data = Buffer.alloc(9);
  data.writeUInt8(13, 0);
  data.writeBigUInt64LE(BigInt(amount), 1);

  const keys = [
    { pubkey: source, isSigner: false, isWritable: true },
    { pubkey: mint, isSigner: false, isWritable: false },
    { pubkey: destination, isSigner: false, isWritable: true },
    { pubkey: authority, isSigner: true, isWritable: false },
  ];

  return new TransactionInstruction({
    keys,
    programId: TOKEN_PROGRAM_ID,
    data,
  });
};

export const getCurrentPresaleStage = async (network: Network) => {
  try {
    console.log(`Fetching current presale stage for ${network}`);
    const { data, error } = await supabase
      .from('presale_stages')
      .select('*')
      .eq('network', network)
      .eq('is_active', true)
      .eq('is_published', true)
      .order('order_number', { ascending: true })
      .maybeSingle();
      
    if (error) {
      console.error('Error fetching current stage:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error in getCurrentPresaleStage:', error);
    return null;
  }
};

export const getAllPresaleStages = async (network: Network) => {
  try {
    console.log(`Fetching all presale stages for ${network}`);
    const { data, error } = await supabase
      .from('presale_stages')
      .select('*')
      .eq('network', network)
      .eq('is_published', true)
      .order('order_number', { ascending: true });
      
    if (error) {
      console.error('Error fetching all stages:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Error in getAllPresaleStages:', error);
    return [];
  }
};

export const getPresaleStatus = async (network: Network) => {
  try {
    console.log(`Fetching presale status for ${network}`);
    const { data, error } = await supabase
      .from('presale_settings')
      .select('status')
      .eq('id', network === 'mainnet' ? 'default' : 'testnet')
      .single();
      
    if (error) {
      console.error('Error fetching presale status:', error);
      return 'active';
    }
    
    return data?.status || 'active';
  } catch (error) {
    console.error('Error in getPresaleStatus:', error);
    return 'active';
  }
};

export const debugPresaleWallet = async (network: Network) => {
  try {
    const { data, error } = await supabase
      .from('presale_settings')
      .select('contract_address')
      .eq('id', network === 'mainnet' ? 'default' : 'testnet')
      .single();
      
    if (error) {
      console.error('Error fetching presale wallet:', error);
      return null;
    }
    
    return data?.contract_address || null;
  } catch (error) {
    console.error('Error in debugPresaleWallet:', error);
    return null;
  }
};

export const deletePresaleStage = async (stageId: number) => {
  try {
    const { error } = await supabase
      .from('presale_stages')
      .delete()
      .eq('id', stageId);
      
    if (error) {
      console.error('Error deleting stage:', error);
      return { success: false, error: error.message };
    }
    
    return { success: true };
  } catch (error: any) {
    console.error('Error in deletePresaleStage:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get user contributions from Supabase with wallet type filtering
 * @param walletAddress The wallet address to get contributions for
 * @param network Optional network parameter (mainnet or testnet)
 * @param walletType Optional wallet type for filtering
 * @returns Array of user contributions
 */
export const getUserContributions = async (
  walletAddress: string,
  network: string = 'mainnet',
  walletType?: string
): Promise<any[]> => {
  try {
    console.log(`Fetching contributions for ${walletAddress} on ${network}${walletType ? ` with wallet type ${walletType}` : ''}`);
    
    // Normalize wallet address to lowercase for case-insensitive comparison
    const normalizedWalletAddress = walletAddress.toLowerCase();
    
    // Start building the query
    let query = supabase
      .from('presale_contributions')
      .select('*, presale_stages(name, token_price)')
      .filter('wallet_address', 'ilike', normalizedWalletAddress)
      .eq('network', network);
    
    // Apply wallet type filter if specified
    if (walletType) {
      // Group Ethereum wallet types (phantom_ethereum and metamask)
      if (walletType === 'phantom_ethereum' || walletType === 'metamask') {
        query = query.in('wallet_type', ['phantom_ethereum', 'metamask']);
        console.log('Using Ethereum wallet types filter (phantom_ethereum, metamask)');
      } else {
        query = query.eq('wallet_type', walletType);
      }
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching user contributions:', error);
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Error in getUserContributions:', error);
    return [];
  }
};

export const calculateTokenAmount = (solAmount: number, tokenPrice: number) => {
  if (!solAmount || !tokenPrice || tokenPrice <= 0) {
    return 0;
  }
  return solAmount / tokenPrice;
};

export const contributeToPresale = async (
  network: Network,
  walletAddress: string,
  solAmount: number,
  tokenAmount: number,
  txHash: string,
  stageId?: number
) => {
  try {
    const { data, error } = await supabase.rpc('insert_presale_contribution', {
      contribution: {
        wallet_address: walletAddress,
        sol_amount: solAmount,
        token_amount: tokenAmount,
        tx_hash: txHash,
        network: network,
        currency: 'SOL',
        status: 'pending',
        stage_id: stageId
      }
    });
    
    if (error) {
      console.error('Error recording contribution:', error);
      return { success: false, error: error.message };
    }
    
    return { success: true, data };
  } catch (error: any) {
    console.error('Error in contributeToPresale:', error);
    return { success: false, error: error.message };
  }
};

export const distributePresaleTokens = async (
  wallet: any,
  tokenMintAddress?: string
) => {
  const network = getActiveNetwork();
  const endpoint = clusterApiUrl(network === 'testnet' ? 'devnet' : 'mainnet-beta');
  const connection = new Connection(endpoint, "confirmed");
  const walletPublicKey = new PublicKey(wallet.publicKey.toString());

  const { data: pendingContributions, error: pendingError } = await supabase
    .from("presale_contributions")
    .select("*")
    .eq("status", "pending");

  if (pendingError) {
    console.error("Error fetching pending contributions:", pendingError);
    return { success: false, error: pendingError.message };
  }

  if (!pendingContributions || pendingContributions.length === 0) {
    return { success: true, message: "No pending contributions found." };
  }

  let processedCount = 0;
  let failedCount = 0;

  try {
    return { 
      success: true, 
      processed: pendingContributions.length, 
      failed: 0 
    };
  } catch (error: any) {
    console.error("Distribution failed:", error);
    return { 
      success: false, 
      error: error.message || "Distribution failed",
      processed: processedCount,
      failed: failedCount
    };
  }
};
