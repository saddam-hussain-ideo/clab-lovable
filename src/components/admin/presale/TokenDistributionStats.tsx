
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from '@/lib/supabase';
import { Loader2, RefreshCw, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { tokenDistributionService } from '@/services/tokenDistributionService';

interface TokenDistributionStatsProps {
  activeNetwork: string;
  refreshStats: () => Promise<void>;
  selectedStageId?: number | null;
}

export function TokenDistributionStats({ 
  activeNetwork, 
  refreshStats,
  selectedStageId = null
}: TokenDistributionStatsProps) {
  const [stats, setStats] = useState({
    totalContributions: 0,
    totalTokens: 0,
    pendingDistributionCount: 0,
    pendingDistributionTokens: 0,
    distributedCount: 0,
    distributedTokens: 0
  });
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [tokenMintAddress, setTokenMintAddress] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      
      // First get the token mint address
      const { data: settings, error: settingsError } = await supabase
        .from('presale_settings')
        .select('token_mint_address')
        .eq('id', activeNetwork === 'mainnet' ? 'default' : 'testnet')
        .maybeSingle();
        
      if (settingsError) {
        console.error("Error fetching token mint address:", settingsError);
      } else {
        setTokenMintAddress(settings?.token_mint_address || localStorage.getItem('manualTokenMintAddress'));
      }
      
      // Use the distribution service for consistent data
      try {
        const distributionStats = await tokenDistributionService.getDistributionStats(
          activeNetwork,
          selectedStageId
        );
        
        if (distributionStats) {
          setStats({
            totalContributions: distributionStats.total.count,
            totalTokens: distributionStats.total.total,
            pendingDistributionCount: distributionStats.pending.count,
            pendingDistributionTokens: distributionStats.pending.total,
            distributedCount: distributionStats.distributed.count,
            distributedTokens: distributionStats.distributed.total
          });
          
          console.log("Stats updated from distribution service:", distributionStats);
        }
      } catch (error) {
        console.error('Error fetching distribution stats from service:', error);
        
        // Fallback to direct database queries
        let query = supabase
          .from('presale_contributions')
          .select('id, token_amount, wallet_address')
          .eq('network', activeNetwork)
          .eq('status', 'completed');
          
        if (selectedStageId) {
          query = query.eq('stage_id', selectedStageId);
        }
          
        // Fetch pending distributions (completed but not distributed)
        let { data: pendingDistribution, error: pendingError } = await query
          .is('distribution_date', null);
          
        if (pendingError) {
          console.error("Error fetching pending distribution:", pendingError);
          throw pendingError;
        }
        
        // Fetch distributed transactions
        let distributedQuery = supabase
          .from('presale_contributions')
          .select('token_amount')
          .eq('network', activeNetwork)
          .eq('status', 'completed')
          .not('distribution_date', 'is', null);
          
        if (selectedStageId) {
          distributedQuery = distributedQuery.eq('stage_id', selectedStageId);
        }
          
        let { data: distributed, error: distributedError } = await distributedQuery;
          
        if (distributedError) {
          console.error("Error fetching distributed contributions:", distributedError);
          throw distributedError;
        }
        
        // Calculate statistics
        const pendingDistributionCount = pendingDistribution ? pendingDistribution.length : 0;
        const pendingDistributionTokens = pendingDistribution 
          ? pendingDistribution.reduce((sum, item) => sum + (Number(item.token_amount) || 0), 0) 
          : 0;
          
        const distributedCount = distributed ? distributed.length : 0;
        const distributedTokens = distributed 
          ? distributed.reduce((sum, item) => sum + (Number(item.token_amount) || 0), 0) 
          : 0;
          
        setStats({
          totalContributions: pendingDistributionCount + distributedCount,
          totalTokens: pendingDistributionTokens + distributedTokens,
          pendingDistributionCount,
          pendingDistributionTokens,
          distributedCount,
          distributedTokens
        });
        
        console.log('Token distribution stats from DB:', {
          pendingDistributionCount,
          pendingDistributionTokens,
          distributedCount,
          distributedTokens
        });
      }
    } catch (error) {
      console.error('Error fetching distribution stats:', error);
      toast.error('Failed to fetch distribution statistics');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
    
    // Add event listener for refreshing distribution stats
    const refreshListener = () => {
      console.log("Refreshing distribution stats due to refresh event");
      fetchStats();
    };
    
    window.addEventListener('distribution_refresh', refreshListener);
    
    // Cleanup function to remove event listener
    return () => {
      window.removeEventListener('distribution_refresh', refreshListener);
    };
  }, [activeNetwork, selectedStageId]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchStats();
    if (refreshStats && typeof refreshStats === 'function') {
      await refreshStats();
    }
    setIsRefreshing(false);
  };

  const formatTokenAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US').format(Math.round(amount * 100) / 100);
  };

  const getPercentage = () => {
    if (stats.totalTokens === 0) return 0;
    return Math.round((stats.distributedTokens / stats.totalTokens) * 100);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle>Distribution Status</CardTitle>
        <Button 
          variant="outline" 
          size="icon" 
          className="h-8 w-8" 
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          {isRefreshing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {!tokenMintAddress && (
              <Alert variant="destructive" className="mb-4">
                <AlertTriangle className="h-4 w-4 mr-2" />
                <AlertDescription>
                  No token mint address configured. Please set up your token mint address before distributing tokens.
                </AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted/50 p-3 rounded-lg">
                  <div className="text-sm text-muted-foreground">Total Tokens</div>
                  <div className="text-2xl font-bold">{formatTokenAmount(stats.totalTokens || 0)}</div>
                  <div className="text-xs text-muted-foreground mt-1">From {stats.totalContributions} contributions</div>
                </div>

                <div className="bg-muted/50 p-3 rounded-lg">
                  <div className="text-sm text-muted-foreground">Distributed</div>
                  <div className="text-2xl font-bold">{formatTokenAmount(stats.distributedTokens || 0)}</div>
                  <div className="text-xs text-muted-foreground mt-1">To {stats.distributedCount} addresses</div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Distribution Progress</span>
                  <span>{getPercentage()}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2.5">
                  <div 
                    className="bg-primary h-2.5 rounded-full" 
                    style={{ width: `${getPercentage()}%` }}
                  ></div>
                </div>
              </div>

              <div className="bg-amber-100 dark:bg-amber-950/30 p-3 rounded-lg border border-amber-200 dark:border-amber-800">
                <div className="text-sm font-medium text-amber-800 dark:text-amber-400">Pending Distribution</div>
                <div className="text-2xl font-bold">{formatTokenAmount(stats.pendingDistributionTokens || 0)}</div>
                <div className="text-xs text-amber-700 dark:text-amber-500 mt-1">For {stats.pendingDistributionCount} contributions</div>
              </div>
              
              {selectedStageId && (
                <div className="text-xs text-center text-muted-foreground mt-2">
                  Showing stats for selected stage only
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
