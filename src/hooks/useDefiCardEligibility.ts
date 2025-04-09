
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { fetchDefiCardSettings, checkWalletDefiCardRegistration } from '@/utils/db/supabase';

export const useDefiCardEligibility = (walletAddress: string | null) => {
  const [isEligible, setIsEligible] = useState(false);
  const [hasRegistered, setHasRegistered] = useState(false);
  const [totalPurchaseAmount, setTotalPurchaseAmount] = useState(0);
  const [minRequiredAmount, setMinRequiredAmount] = useState(500); // Default minimum amount
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkEligibility = async () => {
      if (!walletAddress) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Fetch settings for minimum purchase amount
        const settings = await fetchDefiCardSettings();
        if (settings && settings.min_purchase_amount) {
          setMinRequiredAmount(settings.min_purchase_amount);
        }

        // Check for existing registration
        const registration = await checkWalletDefiCardRegistration(walletAddress);
        setHasRegistered(!!registration);

        // Calculate total purchases directly from contributions
        // This uses the same logic as TotalPurchasesDisplay
        try {
          // Get current SOL price from settings or localStorage
          let solUsdPrice = 133; // Updated default price
          
          // Try to get sol_price from settings
          const { data: settingsData } = await supabase
            .from('presale_settings')
            .select('sol_price')
            .eq('id', 'default')
            .maybeSingle();
          
          if (settingsData && 'sol_price' in settingsData) {
            solUsdPrice = Number(settingsData.sol_price);
          }
          
          // Try to get real-time price if available
          const solPriceFromWindow = (window as any).solanaPrice || localStorage.getItem('solana_price');
          if (solPriceFromWindow) {
            const parsedPrice = typeof solPriceFromWindow === 'string' ? parseFloat(solPriceFromWindow) : solPriceFromWindow;
            if (!isNaN(parsedPrice) && parsedPrice > 0) {
              solUsdPrice = parsedPrice;
            }
          }
          
          // Fetch all valid contributions
          const { data: contributions, error: contribError } = await supabase
            .from('presale_contributions')
            .select('sol_amount, original_amount, currency, stage_id')
            .eq('wallet_address', walletAddress)
            .not('status', 'in', '("rejected", "cancelled")');
              
          if (contribError) {
            throw contribError;
          }
          
          // Calculate total spent across all currencies
          let totalSpent = 0;
          
          if (contributions && contributions.length > 0) {
            for (const contrib of contributions) {
              if (contrib.currency === 'SOL' && contrib.sol_amount) {
                // For SOL transactions, use the SOL price in USD
                totalSpent += contrib.sol_amount * solUsdPrice;
              } 
              else if (['ETH', 'USDC', 'USDT'].includes(contrib.currency) && contrib.original_amount) {
                // For ETH/USDC/USDT, handle appropriately
                if (contrib.currency === 'ETH') {
                  try {
                    // Get current ETH price
                    const ethPriceFromWindow = (window as any).ethereumPrice || localStorage.getItem('ethereum_price');
                    let ethUsdPrice = 3000; // Default value
                    
                    if (ethPriceFromWindow) {
                      const parsedPrice = typeof ethPriceFromWindow === 'string' ? parseFloat(ethPriceFromWindow) : ethPriceFromWindow;
                      if (!isNaN(parsedPrice) && parsedPrice > 0) {
                        ethUsdPrice = parsedPrice;
                      }
                    } else {
                      // Try to get from settings
                      const { data: ethPriceData } = await supabase
                        .from('presale_settings')
                        .select('eth_price')
                        .eq('id', 'default')
                        .maybeSingle();
                          
                      if (ethPriceData && 'eth_price' in ethPriceData) {
                        ethUsdPrice = Number(ethPriceData.eth_price);
                      }
                    }
                    
                    totalSpent += contrib.original_amount * ethUsdPrice;
                  } catch (ethPriceError) {
                    console.warn('Error fetching ETH price:', ethPriceError);
                    // Default ETH price if fetch fails
                    const defaultEthPrice = 3000;
                    totalSpent += contrib.original_amount * defaultEthPrice;
                  }
                } else {
                  // USDC/USDT are stablecoins, so 1:1 USD
                  totalSpent += contrib.original_amount;
                }
              }
            }
          }
          
          setTotalPurchaseAmount(totalSpent);
          
          // Determine eligibility
          setIsEligible(totalSpent >= minRequiredAmount);
        } catch (calcError: any) {
          console.error("Error calculating total purchases:", calcError);
          throw new Error(`Failed to calculate total purchases: ${calcError.message}`);
        }
      } catch (err: any) {
        console.error("Error checking DEFI card eligibility:", err);
        setError(err.message || "An error occurred while checking eligibility");
      } finally {
        setLoading(false);
      }
    };

    checkEligibility();
  }, [walletAddress, minRequiredAmount]);

  return { 
    isEligible, 
    hasRegistered, 
    totalPurchaseAmount, 
    minRequiredAmount, 
    loading, 
    error 
  };
};

export default useDefiCardEligibility;
