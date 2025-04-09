
import { useState, useEffect } from 'react';
import { verifyEthereumTransaction, waitForTransaction } from '@/utils/wallet/transactionVerification';
import { toast } from 'sonner';

type TransactionStatus = 'pending' | 'confirmed' | 'failed' | 'unknown';

export function useTransactionMonitor(
  txHash: string | null,
  network: 'mainnet' | 'testnet' = 'mainnet'
) {
  const [status, setStatus] = useState<TransactionStatus>('unknown');
  const [confirmations, setConfirmations] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!txHash) {
      setStatus('unknown');
      setError(null);
      setConfirmations(0);
      return;
    }

    let isMounted = true;
    let intervalId: number | null = null;

    const checkStatus = async () => {
      try {
        setIsLoading(true);
        const result = await verifyEthereumTransaction(txHash, network);
        
        if (!isMounted) return;

        if (result.error) {
          setError(result.error);
          setStatus('unknown');
        } else if (!result.confirmed) {
          setStatus('pending');
          setConfirmations(0);
        } else if (result.confirmed && result.success) {
          setStatus('confirmed');
          setConfirmations(result.blockConfirmations || 0);
          toast.success('Transaction confirmed!');
        } else {
          setStatus('failed');
          toast.error('Transaction failed on the blockchain');
        }
      } catch (err) {
        if (!isMounted) return;
        setError(err instanceof Error ? err.message : 'Error checking transaction');
        setStatus('unknown');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    // Initial check
    checkStatus();

    // Continue checking until confirmed or failed
    intervalId = window.setInterval(() => {
      // Stop checking if transaction is confirmed or failed
      if (status === 'confirmed' || status === 'failed') {
        if (intervalId) clearInterval(intervalId);
        return;
      }
      
      checkStatus();
    }, 10000); // Check every 10 seconds

    return () => {
      isMounted = false;
      if (intervalId) clearInterval(intervalId);
    };
  }, [txHash, network, status]);

  // Function to wait for transaction confirmation
  const waitForConfirmation = async (requiredConfirmations: number = 1): Promise<boolean> => {
    if (!txHash) return false;
    
    try {
      setIsLoading(true);
      const result = await waitForTransaction(txHash, network, requiredConfirmations);
      if (result.success && result.confirmed) {
        setStatus('confirmed');
        return true;
      } else {
        setStatus('failed');
        setError(result.error || 'Transaction failed');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error waiting for confirmation');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    status,
    confirmations,
    error,
    isLoading,
    waitForConfirmation
  };
}
