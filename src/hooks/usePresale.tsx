import { useState, useEffect } from 'react';
import { formatUnits } from 'viem';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';

// Configure the presale contract address
const PRESALE_CONTRACT_ADDRESS = {
  mainnet: '0x123456789abcdef123456789abcdef123456789a',  // Replace with the real address
  testnet: '0x987654321fedcba987654321fedcba987654321f'  // Replace with the real address
};

interface PresaleStage {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  price: number;
  max_supply: number;
  min_buy_amount: number;
  max_buy_amount: number;
  is_active: boolean;
}

export function usePresale() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tokenPrice, setTokenPrice] = useState<bigint>(BigInt(0));
  const [maxBuyAmount, setMaxBuyAmount] = useState<bigint>(BigInt(1000000000000000000000)); // Default to large number
  const [minBuyAmount, setMinBuyAmount] = useState<bigint>(BigInt(1000000000000000)); // 0.001 ETH equivalent
  const [availableSupply, setAvailableSupply] = useState<bigint>(BigInt(0));
  const [decimals, setDecimals] = useState(18); // Default to 18 for ETH
  const [transactionHash, setTransactionHash] = useState<string | null>(null);

  const { data: activeStage, error: stageError, isLoading: isStageLoading } = useQuery<PresaleStage | null>({
    queryKey: ['activePresaleStage'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('presale_stages')
          .select('*')
          .eq('is_active', true)
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            // No active presale stage found
            console.info('No active presale stage found');
            return null;
          }
          throw error;
        }

        return data;
      } catch (error) {
        console.error('Error fetching active presale stage:', error);
        toast.error('Failed to fetch presale information');
        return null;
      }
    },
    retry: 1,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  useEffect(() => {
    const loadPresaleData = async () => {
      try {
        setLoading(true);
        // Load contract data here
        setLoading(false);
      } catch (err) {
        console.error('Error loading presale data:', err);
        setError('Failed to load presale data');
        setLoading(false);
      }
    };

    loadPresaleData();
  }, []);

  return {
    loading: loading || isStageLoading,
    error: error || stageError,
    tokenPrice,
    availableSupply,
    decimals,
    transactionHash,
    currentStage: activeStage,
    // Use stage values if available, otherwise fallback to contract values
    minBuyAmount: activeStage?.min_buy_amount !== undefined ? 
      BigInt(activeStage.min_buy_amount) : 
      minBuyAmount,
    maxBuyAmount: activeStage?.max_buy_amount !== undefined ? 
      BigInt(activeStage.max_buy_amount) : 
      maxBuyAmount,
    price: activeStage?.price !== undefined ? 
      BigInt(activeStage.price) : 
      tokenPrice,
    maxSupply: activeStage?.max_supply !== undefined ? 
      BigInt(activeStage.max_supply) : 
      availableSupply,
    startDate: activeStage?.start_date || null,
    endDate: activeStage?.end_date || null,
  };
}
