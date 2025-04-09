
import { logDebug } from '@/utils/debugLogging';
import { getCustomEthereumRpcUrl } from './ethereumRpc';

/**
 * Verifies the status of an Ethereum transaction
 * @param txHash The transaction hash to verify
 * @param network The network ('mainnet' or 'testnet')
 * @returns Object containing success status and transaction information
 */
export async function verifyEthereumTransaction(
  txHash: string,
  network: 'mainnet' | 'testnet' = 'mainnet'
): Promise<{
  success: boolean;
  confirmed: boolean;
  blockNumber?: number;
  blockConfirmations?: number;
  error?: string;
}> {
  try {
    if (!txHash || txHash.length !== 66) {
      return {
        success: false,
        confirmed: false,
        error: 'Invalid transaction hash'
      };
    }

    const rpcUrl = await getCustomEthereumRpcUrl(network);
    logDebug('TRANSACTION', `Verifying transaction ${txHash} on ${network} using ${rpcUrl}`);

    // Create JSON-RPC request
    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_getTransactionReceipt',
        params: [txHash]
      })
    });

    if (!response.ok) {
      return {
        success: false,
        confirmed: false,
        error: `HTTP error ${response.status}`
      };
    }

    const data = await response.json();
    
    // If there's no receipt yet, transaction is pending
    if (!data.result) {
      return {
        success: true,
        confirmed: false
      };
    }

    // Parse receipt data
    const receipt = data.result;
    const blockNumber = parseInt(receipt.blockNumber, 16);
    const status = receipt.status === '0x1'; // '0x1' = success, '0x0' = failure

    // Get current block number to calculate confirmations
    const blockResponse = await fetch(rpcUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 2,
        method: 'eth_blockNumber',
        params: []
      })
    });

    const blockData = await blockResponse.json();
    const currentBlock = parseInt(blockData.result, 16);
    const confirmations = currentBlock - blockNumber;

    return {
      success: status,
      confirmed: true,
      blockNumber,
      blockConfirmations: confirmations
    };
  } catch (error) {
    console.error('Error verifying Ethereum transaction:', error);
    return {
      success: false,
      confirmed: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Wait for a transaction to be confirmed
 * @param txHash The transaction hash
 * @param network The network ('mainnet' or 'testnet')
 * @param confirmations Number of confirmations to wait for (default: 1)
 * @param timeout Maximum time to wait in ms (default: 60000 = 1 minute)
 */
export async function waitForTransaction(
  txHash: string,
  network: 'mainnet' | 'testnet' = 'mainnet',
  confirmations: number = 1,
  timeout: number = 60000
): Promise<{
  success: boolean;
  confirmed: boolean;
  error?: string;
}> {
  return new Promise((resolve) => {
    const startTime = Date.now();
    let intervalId: number | null = null;

    const checkTransaction = async () => {
      // Check if we've exceeded the timeout
      if (Date.now() - startTime > timeout) {
        if (intervalId) clearInterval(intervalId);
        resolve({
          success: false,
          confirmed: false,
          error: 'Transaction verification timed out'
        });
        return;
      }

      try {
        const result = await verifyEthereumTransaction(txHash, network);
        
        // If transaction is confirmed and has enough confirmations
        if (result.confirmed && result.success && (result.blockConfirmations || 0) >= confirmations) {
          if (intervalId) clearInterval(intervalId);
          resolve({
            success: true,
            confirmed: true
          });
          return;
        }
        
        // If transaction was confirmed but failed
        if (result.confirmed && !result.success) {
          if (intervalId) clearInterval(intervalId);
          resolve({
            success: false,
            confirmed: true,
            error: 'Transaction failed on-chain'
          });
          return;
        }
      } catch (error) {
        console.error('Error in transaction check:', error);
        // Don't stop checking, continue until timeout
      }
    };

    // Check immediately and then set interval
    checkTransaction();
    intervalId = window.setInterval(checkTransaction, 5000); // Check every 5 seconds
  });
}
