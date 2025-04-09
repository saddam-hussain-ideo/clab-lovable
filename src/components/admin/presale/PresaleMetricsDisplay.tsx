import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, TrendingUp, Users, Coins, ActivitySquare, DollarSign } from "lucide-react";
import { getActiveNetwork } from "@/utils/wallet";
import { useCryptoPrices } from "@/hooks/useCryptoPrices";
import { formatNumberWithCommas } from "@/utils/helpers";

interface PresaleMetric {
  label: string;
  value: string | number;
  previousValue?: string | number;
  change?: number;
  icon: React.ReactNode;
  color: string;
}

export function PresaleMetricsDisplay() {
  const [isLoading, setIsLoading] = useState(true);
  const [metrics, setMetrics] = useState<PresaleMetric[]>([]);
  const [contributionData, setContributionData] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const network = getActiveNetwork();
  
  // Use the useCryptoPrices hook with empty parameters (it ignores them anyway)
  const { getPrice } = useCryptoPrices();
  const solPrice = getPrice("solana") || 0;
  const ethPrice = getPrice("ethereum") || 3000; // Fallback price if unavailable

  useEffect(() => {
    async function fetchMetrics() {
      try {
        setIsLoading(true);
        setError(null);
        
        // Fetch presale settings
        const { data: settingsData, error: settingsError } = await supabase
          .from('presale_settings')
          .select('*')
          .eq('id', network === 'mainnet' ? 'default' : 'testnet')
          .single();
        
        if (settingsError) throw settingsError;
        
        // Fetch active stage info
        const { data: stagesData, error: stagesError } = await supabase
          .from('presale_stages')
          .select('*')
          .eq('is_active', true)
          .eq('network', network)
          .order('order_number', { ascending: true })
          .maybeSingle();
        
        if (stagesError) throw stagesError;
        
        // Fetch all completed contributions regardless of stage
        const { data: allContributionsData, error: allContributionsError } = await supabase
          .from('presale_contributions')
          .select('sol_amount, token_amount, status, created_at, wallet_address, currency, original_amount, wallet_type')
          .eq('network', network)
          .eq('status', 'completed')
          .order('created_at', { ascending: false });
        
        if (allContributionsError) throw allContributionsError;
        
        console.log('Contributions data:', allContributionsData);
        
        // Calculate metrics for all completed contributions
        let totalSolRaised = 0;
        let totalUsdRaised = 0;
        let ethContributions = 0;
        let solContributions = 0;
        let usdtContributions = 0;
        let usdcContributions = 0;
        
        if (allContributionsData && allContributionsData.length > 0) {
          allContributionsData.forEach(contribution => {
            // Handle each contribution based on currency and wallet type
            if (contribution.currency === 'SOL') {
              totalSolRaised += parseFloat(contribution.sol_amount) || 0;
              totalUsdRaised += (parseFloat(contribution.sol_amount) || 0) * solPrice;
              solContributions++;
            } 
            else if (contribution.currency === 'ETH' && contribution.wallet_type === 'metamask') {
              const ethAmount = parseFloat(contribution.original_amount) || 0;
              // Convert ETH to USD
              totalUsdRaised += ethAmount * ethPrice;
              ethContributions++;
            }
            else if (contribution.currency === 'USDC' && contribution.wallet_type === 'metamask') {
              // For USDC on Ethereum, the amount is already in USD
              totalUsdRaised += parseFloat(contribution.original_amount) || 0;
              usdcContributions++;
            }
            else if (contribution.currency === 'USDT' && contribution.wallet_type === 'metamask') {
              // For USDT on Ethereum, the amount is already in USD
              totalUsdRaised += parseFloat(contribution.original_amount) || 0;
              usdtContributions++;
            }
            else if (['USDC', 'USDT'].includes(contribution.currency)) {
              // For USDC/USDT on Solana, convert to USD (they are 1:1 with USD)
              totalUsdRaised += parseFloat(contribution.original_amount) || 0;
              contribution.currency === 'USDC' ? usdcContributions++ : usdtContributions++;
            }
          });
        }
        
        console.log('Contribution metrics:', {
          totalSolRaised,
          totalUsdRaised,
          ethContributions,
          solContributions,
          usdcContributions,
          usdtContributions
        });
          
        const totalTokensSold = allContributionsData
          ?.reduce((sum, current) => sum + (parseFloat(current.token_amount) || 0), 0) || 0;
        
        // Count unique contributors
        const uniqueWallets = new Set();
        allContributionsData?.forEach(contribution => {
          if (contribution.wallet_address) {
            uniqueWallets.add(contribution.wallet_address);
          }
        });
        const contributorsCount = uniqueWallets.size;
        
        // Contribution data for current stage
        const { data: contributionsData, error: contributionsError } = await supabase
          .from('presale_contributions')
          .select('sol_amount, token_amount, status, created_at, currency, original_amount, wallet_type')
          .eq('network', network)
          .eq('status', 'completed')
          .order('created_at', { ascending: false });
        
        if (contributionsError) throw contributionsError;
        
        // Group contribution data by date for chart
        const last7Days = [];
        for (let i = 6; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          last7Days.push(date.toISOString().split('T')[0]);
        }
        
        const chartData = last7Days.map(day => {
          const dayContributions = contributionsData?.filter(c => {
            const contribDate = new Date(c.created_at).toISOString().split('T')[0];
            return contribDate === day && c.status === 'completed';
          }) || [];
          
          // Calculate daily USD amount from all currencies
          let dailyUsdAmount = 0;
          
          dayContributions.forEach(contribution => {
            if (contribution.currency === 'SOL') {
              dailyUsdAmount += (parseFloat(contribution.sol_amount) || 0) * solPrice;
            } 
            else if (contribution.currency === 'ETH' && contribution.wallet_type === 'metamask') {
              dailyUsdAmount += (parseFloat(contribution.original_amount) || 0) * ethPrice;
            }
            else if (['USDC', 'USDT'].includes(contribution.currency) && contribution.wallet_type === 'metamask') {
              // For stablecoins on Ethereum, their value is equal to the original amount in USD
              dailyUsdAmount += parseFloat(contribution.original_amount) || 0;
            }
            else if (['USDC', 'USDT'].includes(contribution.currency)) {
              // For stablecoins on Solana, their value is equal to the original amount in USD
              dailyUsdAmount += parseFloat(contribution.original_amount) || 0;
            }
          });
          
          return {
            date: day,
            amount: 0, // No longer using SOL amount directly in chart
            amountUsd: parseFloat(dailyUsdAmount.toFixed(2)),
            count: dayContributions.length
          };
        });
        
        setContributionData(chartData);
        
        // Format current active stage
        const currentStage = stagesData ? 
          `Stage ${stagesData.order_number}: ${stagesData.name}` : 
          'No active stage';
          
        // Target amount from active stage or settings
        const targetAmount = (stagesData?.target_amount || settingsData?.target || 0);
        const targetAmountUsd = (stagesData?.target_amount_usd || (targetAmount * solPrice) || 0);
        
        // Calculate percentage progress
        const progressPercentage = targetAmountUsd > 0 
          ? Math.min(100, Math.round((totalUsdRaised / targetAmountUsd) * 100)) 
          : 0;
          
        // Get token price for display
        const tokenPriceUsd = stagesData?.token_price_usd || 
                             (stagesData?.token_price ? stagesData.token_price * solPrice : 0.00025);
        
        const calculatedMetrics: PresaleMetric[] = [
          {
            label: 'Total USD Raised',
            value: `$${formatNumberWithCommas(totalUsdRaised)}`,
            icon: <DollarSign className="h-5 w-5" />,
            color: 'text-green-500'
          },
          {
            label: 'Total SOL Raised',
            value: totalSolRaised.toFixed(4),
            icon: <Coins className="h-5 w-5" />,
            color: 'text-yellow-500'
          },
          {
            label: 'Tokens Sold',
            value: totalTokensSold.toLocaleString(),
            icon: <ActivitySquare className="h-5 w-5" />,
            color: 'text-purple-500'
          },
          {
            label: 'Contributors',
            value: contributorsCount,
            icon: <Users className="h-5 w-5" />,
            color: 'text-blue-500'
          },
          {
            label: 'Token Price',
            value: `$${tokenPriceUsd.toFixed(5)}`,
            icon: <TrendingUp className="h-5 w-5" />,
            color: 'text-emerald-500'
          }
        ];
        
        setMetrics(calculatedMetrics);
      } catch (err: any) {
        console.error('Error fetching presale metrics:', err);
        setError(`Failed to load presale metrics: ${err.message}`);
      } finally {
        setIsLoading(false);
      }
    }

    fetchMetrics();
    // Refresh every 30 seconds
    const interval = setInterval(fetchMetrics, 30000);
    return () => clearInterval(interval);
  }, [network, solPrice, ethPrice]);

  if (error) {
    return (
      <Alert variant="error">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {isLoading ? (
          Array(5).fill(0).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ))
        ) : (
          metrics.map((metric, idx) => (
            <Card key={idx} className="overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                  <span className={`mr-2 ${metric.color}`}>{metric.icon}</span>
                  {metric.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metric.value}</div>
                {metric.change !== undefined && (
                  <p className={`text-xs ${metric.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {metric.change >= 0 ? '↑' : '↓'} {Math.abs(metric.change)}% from previous
                  </p>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Contribution Activity (Last 7 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-[200px] w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={contributionData}>
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return `${date.getDate()}/${date.getMonth() + 1}`;
                  }}
                />
                <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                <Tooltip 
                  formatter={(value, name) => {
                    if (name === "amount") return [`${value} SOL`, "Amount"];
                    if (name === "amountUsd") return [`$${value}`, "USD Value"];
                    return [value, "Transactions"];
                  }}
                />
                <Bar yAxisId="left" dataKey="amountUsd" fill="#4ade80" name="USD Value" radius={[4, 4, 0, 0]}>
                  {contributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.amountUsd > 0 ? "#4ade80" : "#eee"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
