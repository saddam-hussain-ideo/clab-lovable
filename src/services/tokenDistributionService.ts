
import { supabase } from '@/lib/supabase';

interface DistributionRecipient {
  id: number;
  address: string;
  amount: number;
}

interface DistributionFilter {
  network?: string;
  stageId?: number | null;
}

interface DistributionStats {
  pending: {
    count: number;
    total: number;
    distributions: DistributionRecipient[];
  };
  distributed: {
    count: number;
    total: number;
  };
  total: {
    count: number;
    total: number;
  };
}

/**
 * Service responsible for token distribution operations and database interactions
 */
export const tokenDistributionService = {
  /**
   * Fetch token mint address from settings
   */
  async fetchTokenMintAddress(network: string = 'testnet'): Promise<string | null> {
    try {
      // First try to get from localStorage for manually set addresses
      const manualTokenAddress = localStorage.getItem('manualTokenMintAddress');
      if (manualTokenAddress) {
        console.log(`Using manually set token address: ${manualTokenAddress}`);
        return manualTokenAddress;
      }
      
      // Fall back to settings table
      const { data, error } = await supabase
        .from('presale_settings')
        .select('token_mint_address')
        .eq('id', network === 'mainnet' ? 'default' : 'testnet')
        .maybeSingle();
        
      if (error) throw error;
      
      return data?.token_mint_address || null;
    } catch (error) {
      console.error('Error fetching token mint address:', error);
      return null;
    }
  },

  /**
   * Fetch presale stages for dropdown selection
   */
  async fetchPresaleStages(network: string = 'testnet'): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('presale_stages')
        .select('id, name, order_number')
        .eq('network', network)
        .order('order_number', { ascending: true });
        
      if (error) throw error;
      
      return data || [];
    } catch (error) {
      console.error('Error fetching presale stages:', error);
      return [];
    }
  },

  /**
   * Fetch pending distributions that haven't been sent tokens yet
   */
  async fetchPendingDistributions(filter: DistributionFilter = {}): Promise<DistributionRecipient[]> {
    try {
      console.log(`Fetching pending distributions with filter:`, filter);
      
      let query = supabase
        .from('presale_contributions')
        .select('id, wallet_address, token_amount')
        .eq('status', 'completed')
        .is('distribution_status', null);

      if (filter.network) {
        query = query.eq('network', filter.network);
      }

      if (filter.stageId) {
        console.log(`Filtering by stage ID: ${filter.stageId}`);
        query = query.eq('stage_id', filter.stageId);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Error in fetchPendingDistributions query:', error);
        throw error;
      }
      
      // Log the actual data received
      console.log(`fetchPendingDistributions retrieved ${data?.length || 0} records with filter:`, filter);
      
      // Map to the expected format for the distribution component
      return (data || []).map(item => ({
        id: item.id,
        address: item.wallet_address,
        amount: parseFloat(item.token_amount)
      }));
    } catch (error) {
      console.error('Error fetching pending distributions:', error);
      return [];
    }
  },

  /**
   * Fetch distribution statistics including pending and completed distributions
   */
  async getDistributionStats(network: string = 'testnet', stageId: number | null = null): Promise<DistributionStats> {
    try {
      console.log(`Fetching distribution stats for network: ${network}, stageId: ${stageId || 'all'}`);
      
      // Prepare filter for pending distributions
      const filter: DistributionFilter = { network };
      if (stageId) filter.stageId = stageId;
      
      // Fetch pending distributions
      const pendingDistributions = await this.fetchPendingDistributions(filter);
      
      // Create the distributed query using the same filter logic
      let distributedQuery = supabase
        .from('presale_contributions')
        .select('id, token_amount')
        .eq('status', 'completed')
        .eq('network', network)
        .not('distribution_status', 'is', null);
        
      if (stageId) {
        distributedQuery = distributedQuery.eq('stage_id', stageId);
      }
      
      const { data: distributedData, error: distributedError } = await distributedQuery;
        
      if (distributedError) {
        console.error('Error fetching distributed contributions in getDistributionStats:', distributedError);
        throw distributedError;
      }
      
      console.log(`getDistributionStats retrieved ${pendingDistributions.length || 0} pending distributions and ${distributedData?.length || 0} distributed`);
      
      // Calculate statistics
      const pendingCount = pendingDistributions.length;
      const pendingTotal = pendingDistributions.reduce((sum, item) => sum + (item.amount || 0), 0);
      
      const distributedCount = distributedData?.length || 0;
      const distributedTotal = (distributedData || []).reduce((sum, item) => sum + parseFloat(item.token_amount || '0'), 0);
      
      // Return structured stats
      return {
        pending: {
          count: pendingCount,
          total: pendingTotal,
          distributions: pendingDistributions
        },
        distributed: {
          count: distributedCount,
          total: distributedTotal
        },
        total: {
          count: pendingCount + distributedCount,
          total: pendingTotal + distributedTotal
        }
      };
    } catch (error) {
      console.error('Error fetching distribution stats:', error);
      // Return empty stats on error
      return {
        pending: { count: 0, total: 0, distributions: [] },
        distributed: { count: 0, total: 0 },
        total: { count: 0, total: 0 }
      };
    }
  },

  /**
   * Mark contributions as distributed in the database
   */
  async markContributionsAsDistributed(contributionIds: number[]): Promise<number> {
    if (!contributionIds.length) return 0;
    
    try {
      const now = new Date().toISOString();
      
      const { data, error } = await supabase
        .from('presale_contributions')
        .update({
          distribution_status: 'completed',
          distribution_date: now
        })
        .in('id', contributionIds);
      
      if (error) throw error;
      
      return contributionIds.length;
    } catch (error) {
      console.error('Error marking contributions as distributed:', error);
      throw error;
    }
  },
  
  /**
   * Save token mint address for future reference
   */
  async saveTokenMintAddress(mintAddress: string, network: string = 'testnet'): Promise<boolean> {
    try {
      // First save to localStorage for easy access
      localStorage.setItem('manualTokenMintAddress', mintAddress);
      
      // Then try to save to database
      const { error } = await supabase
        .from('presale_settings')
        .update({ token_mint_address: mintAddress })
        .eq('id', network === 'mainnet' ? 'default' : 'testnet');
        
      if (error) throw error;
      
      return true;
    } catch (error) {
      console.error('Error saving token mint address:', error);
      return false;
    }
  },
  
  /**
   * Validate a token mint address (basic format check)
   */
  validateTokenFormat(mintAddress: string): boolean {
    // Basic check for Solana address format
    return /^[A-HJ-NP-Za-km-z1-9]{32,44}$/.test(mintAddress);
  }
};
