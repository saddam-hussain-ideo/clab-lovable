
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { PhantomProvider } from '@/utils/wallet/types';
import { getActiveNetwork } from '@/utils/wallet/index';
import { getClabTokenMetadata } from '@/utils/token/tokenMetadata';

interface TokenDistributionState {
  isDistributing: boolean;
  progress: {
    current: number;
    total: number;
    percentage: number;
  };
  error: string | null;
  walletStatus: 'disconnected' | 'connecting' | 'connected' | 'error' | 'pending';
  walletMessage: string | null;
  batches: any[];
  network: string;
}

interface UseTokenDistributionResult extends TokenDistributionState {
  startDistribution: (wallet: PhantomProvider) => Promise<void>;
  resetDistribution: () => void;
}

export const useTokenDistribution = (tokenMintAddress?: string): UseTokenDistributionResult => {
  const [state, setState] = useState<TokenDistributionState>({
    isDistributing: false,
    progress: {
      current: 0,
      total: 0,
      percentage: 0
    },
    error: null,
    walletStatus: 'disconnected',
    walletMessage: null,
    batches: [],
    network: getActiveNetwork()
  });

  useEffect(() => {
    const handleNetworkChange = () => {
      setState(prev => ({
        ...prev,
        network: getActiveNetwork()
      }));
    };

    window.addEventListener('presaleNetworkChanged', handleNetworkChange);
    
    return () => {
      window.removeEventListener('presaleNetworkChanged', handleNetworkChange);
    };
  }, []);

  useEffect(() => {
    const handleDistributionProgress = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { current, total, percentage } = customEvent.detail;
      
      setState(prev => ({
        ...prev,
        progress: {
          current,
          total,
          percentage
        }
      }));
    };
    
    const handleWalletStatus = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { status, message } = customEvent.detail;
      
      setState(prev => ({
        ...prev,
        walletStatus: status,
        walletMessage: message || null,
        error: status === 'error' ? message || 'An unknown wallet error occurred' : prev.error
      }));
    };
    
    const handleBatchUpdate = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { batchIndex, status, walletUpdates, error } = customEvent.detail;
      
      setState(prev => {
        const newBatches = [...prev.batches];
        
        let batch = newBatches.find(b => b.batchNumber === batchIndex + 1);
        
        if (!batch) {
          batch = {
            batchNumber: batchIndex + 1,
            totalBatches: 0,
            recipients: [],
            status: 'processing'
          };
          newBatches.push(batch);
        }
        
        batch.status = status;
        if (error) batch.error = error;
        
        if (walletUpdates && walletUpdates.length > 0) {
          walletUpdates.forEach(update => {
            if (batch.recipients[update.index]) {
              batch.recipients[update.index].status = update.status;
            }
          });
        }
        
        newBatches.sort((a, b) => a.batchNumber - b.batchNumber);
        
        return {
          ...prev,
          batches: newBatches,
          error: status === 'failed' ? error || prev.error : prev.error
        };
      });
    };
    
    const handleDistributionComplete = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { success, processed, failed, error } = customEvent.detail;
      
      setState(prev => ({
        ...prev,
        isDistributing: false,
        error: success ? null : (error || `Failed to distribute ${failed} contributions`),
        walletStatus: 'connected'
      }));
      
      if (success) {
        if (failed > 0) {
          toast(`Distribution completed with issues. Processed: ${processed}, Failed: ${failed}`);
        } else {
          toast.success(`Successfully distributed tokens to ${processed} contributions.`);
        }
      } else {
        toast.error(error || "Failed to distribute tokens");
      }
    };
    
    window.addEventListener('distribution_progress', handleDistributionProgress);
    window.addEventListener('distribution_wallet_status', handleWalletStatus);
    window.addEventListener('distribution_batch_update', handleBatchUpdate);
    window.addEventListener('distribution_complete', handleDistributionComplete);
    
    return () => {
      window.removeEventListener('distribution_progress', handleDistributionProgress);
      window.removeEventListener('distribution_wallet_status', handleWalletStatus);
      window.removeEventListener('distribution_batch_update', handleBatchUpdate);
      window.removeEventListener('distribution_complete', handleDistributionComplete);
    };
  }, []);

  const startDistribution = useCallback(async (wallet: PhantomProvider) => {
    const currentNetwork = getActiveNetwork();
    if (!currentNetwork) {
      toast.error("Network not selected. Please select mainnet or testnet.");
      return;
    }
    
    if (!wallet || !wallet.publicKey) {
      toast.error("Wallet not connected");
      return;
    }
    
    let finalTokenMintAddress = tokenMintAddress;
    
    if (!finalTokenMintAddress) {
      try {
        // Map wallet network type to token metadata network type
        // Fix: Update this line to handle the proper network types
        const tokenNetwork = currentNetwork === 'testnet' ? 'testnet' : 'mainnet';
        const clabMetadata = getClabTokenMetadata(tokenNetwork);
        finalTokenMintAddress = clabMetadata.address;
        console.log("Using CLAB token address:", finalTokenMintAddress);
      } catch (error) {
        toast.error("Could not determine token mint address. Please provide it manually.");
        console.error("Error getting CLAB token metadata:", error);
        return;
      }
    }
    
    try {
      setState(prev => ({
        ...prev,
        isDistributing: true,
        error: null,
        batches: [],
        progress: {
          current: 0,
          total: 0,
          percentage: 0
        },
        walletStatus: 'connecting',
        network: currentNetwork
      }));
      
      console.log(`Starting distribution on network: ${currentNetwork}`);
      
      let attempts = 0;
      const maxAttempts = 3;
      let lastError: any = null;
      
      while (attempts < maxAttempts) {
        try {
          const { distributePresaleTokens } = await import('@/utils/token/solanaToken');
          
          const result = await distributePresaleTokens(wallet, finalTokenMintAddress, []);
          
          if (!result.success) {
            if (result.error && 
               (result.error.includes('429') || 
                result.error.includes('rate limit') || 
                result.error.includes('exceeded'))) {
              
              console.warn(`Rate limit encountered (attempt ${attempts + 1}/${maxAttempts}):`, result.error);
              
              attempts++;
              
              if (attempts < maxAttempts) {
                toast.info(`Network congestion detected. Retrying... (${attempts}/${maxAttempts})`);
                
                const backoffTime = Math.pow(2, attempts) * 2000;
                await new Promise(resolve => setTimeout(resolve, backoffTime));
                continue;
              }
            }
            
            setState(prev => ({
              ...prev,
              isDistributing: false,
              error: result.error || "Distribution failed",
              walletStatus: 'error'
            }));
            
            return;
          }
          
          return;
        } catch (error: any) {
          lastError = error;
          console.error(`Error in distribution attempt ${attempts + 1}/${maxAttempts}:`, error);
          
          if (error.message && 
             (error.message.includes('429') || 
              error.message.includes('rate limit') || 
              error.message.includes('exceeded'))) {
            
            attempts++;
            
            if (attempts < maxAttempts) {
              toast.info(`Network congestion detected. Retrying... (${attempts}/${maxAttempts})`);
              
              const backoffTime = Math.pow(2, attempts) * 2000;
              await new Promise(resolve => setTimeout(resolve, backoffTime));
              continue;
            }
          }
          
          setState(prev => ({
            ...prev,
            isDistributing: false,
            error: error.message || "An unexpected error occurred",
            walletStatus: 'error'
          }));
          
          toast.error(error.message || "An unexpected error occurred during distribution");
          return;
        }
      }
      
      if (lastError) {
        setState(prev => ({
          ...prev,
          isDistributing: false,
          error: "Multiple distribution attempts failed due to network congestion. Please try again later.",
          walletStatus: 'error'
        }));
        
        toast.error("Distribution failed after multiple attempts due to network congestion.");
      }
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        isDistributing: false,
        error: error.message || "An unexpected error occurred",
        walletStatus: 'error'
      }));
      
      toast.error(error.message || "An unexpected error occurred during distribution");
    }
  }, [tokenMintAddress]);

  const resetDistribution = useCallback(() => {
    setState({
      isDistributing: false,
      progress: {
        current: 0,
        total: 0,
        percentage: 0
      },
      error: null,
      walletStatus: 'disconnected',
      walletMessage: null,
      batches: [],
      network: getActiveNetwork()
    });
  }, []);

  return {
    ...state,
    startDistribution,
    resetDistribution
  };
};
