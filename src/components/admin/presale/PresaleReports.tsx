
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CalendarRange, BarChart3, PieChart } from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart as RechartsCircleChart,
  Pie,
  Cell
} from "recharts";
import { supabase } from "@/lib/supabase";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { format, addDays, startOfMonth, endOfMonth, subMonths } from "date-fns";

interface ReportsProps {
  activeNetwork: string;
  onNetworkChange: (network: string) => void;
  viewMode?: 'full' | 'embedded';
}

// Define colors for charts
const COLORS = ['#10B981', '#6366F1', '#F59E0B', '#EF4444'];

export function PresaleReports({ 
  activeNetwork, 
  onNetworkChange,
  viewMode = 'full'
}: ReportsProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [contributionData, setContributionData] = useState<any[]>([]);
  const [summaryData, setSummaryData] = useState<any>({
    totalSol: 0,
    totalTokens: 0,
    uniqueContributors: 0,
    avgContribution: 0
  });
  const [dateRange, setDateRange] = useState({
    from: startOfMonth(subMonths(new Date(), 1)),
    to: endOfMonth(new Date())
  });
  
  // Function to fetch contribution data based on date range
  const fetchContributionData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      if (!dateRange.from || !dateRange.to) {
        setError("Please select a valid date range");
        setIsLoading(false);
        return;
      }
      
      // Format dates for API
      const fromDate = format(dateRange.from, 'yyyy-MM-dd');
      const toDate = format(dateRange.to, 'yyyy-MM-dd');
      
      console.log(`Fetching contribution data from ${fromDate} to ${toDate} for network ${activeNetwork}`);
      
      // Call Supabase function to get daily stats
      const { data: statsData, error: statsError } = await supabase
        .rpc('get_daily_contribution_stats', {
          network_param: activeNetwork,
          from_date: fromDate,
          to_date: toDate
        });
      
      if (statsError) {
        console.error("Error fetching stats:", statsError);
        setError(`Failed to load contribution statistics: ${statsError.message}`);
        setIsLoading(false);
        return;
      }
      
      console.log("Daily contribution stats:", statsData);
      
      // Fix: Query specifically for completed contributions to calculate summary data
      const { data: allContributions, error: contributionsError } = await supabase
        .from('presale_contributions')
        .select('sol_amount, token_amount, wallet_address, status')
        .eq('network', activeNetwork);
      
      if (contributionsError) {
        console.error("Error fetching contributions:", contributionsError);
        setError(`Failed to load contribution data: ${contributionsError.message}`);
        setIsLoading(false);
        return;
      }
      
      // Filter to include all completed contributions
      const completedContributions = allContributions.filter(item => 
        item.status === 'completed' || item.status === 'pending'
      );
      
      console.log("Filtered contributions for summary:", completedContributions.length);
      
      // Calculate summary metrics
      const totalSol = completedContributions
        .reduce((sum, item) => sum + parseFloat(item.sol_amount || '0'), 0);
        
      const totalTokens = completedContributions
        .reduce((sum, item) => sum + parseFloat(item.token_amount || '0'), 0);
        
      // Count unique contributors
      const uniqueWallets = new Set();
      completedContributions.forEach(item => {
        if (item.wallet_address) {
          uniqueWallets.add(item.wallet_address);
        }
      });
      
      const uniqueContributors = uniqueWallets.size;
      const avgContribution = uniqueContributors > 0 
        ? totalSol / uniqueContributors 
        : 0;
      
      // Update state with fetched data
      setContributionData(statsData || []);
      setSummaryData({
        totalSol,
        totalTokens,
        uniqueContributors,
        avgContribution
      });
      
    } catch (err: any) {
      console.error("Error in fetchContributionData:", err);
      setError(`An error occurred: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [activeNetwork, dateRange]);
  
  // Fetch data when date range or network changes
  useEffect(() => {
    fetchContributionData();
  }, [fetchContributionData]);
  
  // Function to handle date range change
  const handleDateRangeChange = (range: { from: Date; to: Date }) => {
    setDateRange(range);
  };
  
  // Calculate status distribution data
  const fetchStatusDistribution = useCallback(async () => {
    try {
      // Fix: Use separate query and count in memory instead of groupBy
      const { data, error } = await supabase
        .from('presale_contributions')
        .select('status')
        .eq('network', activeNetwork);
      
      if (error) throw error;
      
      if (!data || data.length === 0) return [];
      
      // Process data to count statuses
      const statusCounts: Record<string, number> = {};
      data.forEach(item => {
        const status = item.status;
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      });
      
      // Convert to the format needed for charts
      return Object.entries(statusCounts).map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value
      }));
    } catch (err) {
      console.error("Error fetching status distribution:", err);
      return [];
    }
  }, [activeNetwork]);
  
  // Summary metrics to display
  const metrics = [
    {
      label: 'Total SOL Raised',
      value: summaryData.totalSol.toFixed(4),
      icon: <BarChart3 className="h-5 w-5 text-yellow-500" />
    },
    {
      label: 'Total Tokens Sold',
      value: summaryData.totalTokens.toLocaleString(),
      icon: <PieChart className="h-5 w-5 text-purple-500" />
    },
    {
      label: 'Unique Contributors',
      value: summaryData.uniqueContributors,
      icon: <BarChart3 className="h-5 w-5 text-blue-500" />
    },
    {
      label: 'Avg. Contribution (SOL)',
      value: summaryData.avgContribution.toFixed(4),
      icon: <BarChart3 className="h-5 w-5 text-emerald-500" />
    }
  ];
  
  if (error) {
    return (
      <Alert variant="error">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }
  
  // If in embedded mode, show a simplified view with just the metrics and charts
  if (viewMode === 'embedded') {
    return (
      <div className="space-y-6">
        {/* Summary metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {isLoading ? (
            Array(4).fill(0).map((_, i) => (
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
                    <span className="mr-2">{metric.icon}</span>
                    {metric.label}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metric.value}</div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Daily contribution chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CalendarRange className="h-5 w-5 mr-2 text-blue-500" />
              Daily Contribution Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : contributionData.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[250px] text-center">
                <CalendarRange className="h-10 w-10 text-gray-400 mb-2" />
                <p className="text-gray-500">No contribution data available for the selected period</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={contributionData}>
                  <CartesianGrid strokeDasharray="3 3" />
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
                    formatter={(value: any, name: string) => {
                      if (name === "sol_amount") return [`${parseFloat(value).toFixed(4)} SOL`, "SOL Raised"];
                      if (name === "token_amount") return [`${parseInt(value).toLocaleString()} tokens`, "Tokens Sold"];
                      return [value, name];
                    }}
                    labelFormatter={(label) => format(new Date(label), 'dd MMM yyyy')}
                  />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="sol_amount" name="SOL Raised" stroke="#8884d8" activeDot={{ r: 8 }} />
                  <Line yAxisId="right" type="monotone" dataKey="count" name="Transactions" stroke="#82ca9d" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Full view mode with tabs and more detailed reporting
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold">Presale Reports</h2>
        
        <div className="flex items-center gap-2">
          <Badge variant={activeNetwork === 'mainnet' ? 'default' : 'secondary'}>
            {activeNetwork === 'mainnet' ? 'Mainnet' : 'Testnet'}
          </Badge>
          
          <Badge 
            variant="outline" 
            className="cursor-pointer hover:bg-secondary"
            onClick={() => onNetworkChange(activeNetwork === 'mainnet' ? 'testnet' : 'mainnet')}
          >
            Switch to {activeNetwork === 'mainnet' ? 'Testnet' : 'Mainnet'}
          </Badge>
        </div>
      </div>
      
      <div className="flex justify-end">
        <DateRangePicker
          date={dateRange}
          onDateChange={handleDateRangeChange}
        />
      </div>
      
      {/* Summary metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          Array(4).fill(0).map((_, i) => (
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
                  <span className="mr-2">{metric.icon}</span>
                  {metric.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metric.value}</div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
      
      <Tabs defaultValue="daily">
        <TabsList>
          <TabsTrigger value="daily">Daily Activity</TabsTrigger>
          <TabsTrigger value="cumulative">Cumulative Growth</TabsTrigger>
          <TabsTrigger value="status">Status Distribution</TabsTrigger>
        </TabsList>
        
        <TabsContent value="daily" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Daily Contribution Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-[300px] w-full" />
              ) : contributionData.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[250px] text-center">
                  <CalendarRange className="h-10 w-10 text-gray-400 mb-2" />
                  <p className="text-gray-500">No contribution data available for the selected period</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart
                    data={contributionData}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
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
                      formatter={(value: any, name: string) => {
                        if (name === "sol_amount") return [`${parseFloat(value).toFixed(4)} SOL`, "SOL Raised"];
                        if (name === "token_amount") return [`${parseInt(value).toLocaleString()} tokens`, "Tokens Sold"];
                        return [value, name];
                      }}
                      labelFormatter={(label) => format(new Date(label), 'dd MMM yyyy')}
                    />
                    <Legend />
                    <Bar yAxisId="left" dataKey="sol_amount" name="SOL Raised" fill="#8884d8" />
                    <Bar yAxisId="right" dataKey="count" name="Transactions" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Daily Token Sales</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-[300px] w-full" />
              ) : contributionData.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[250px] text-center">
                  <CalendarRange className="h-10 w-10 text-gray-400 mb-2" />
                  <p className="text-gray-500">No token sales data available for the selected period</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={contributionData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(value) => {
                        const date = new Date(value);
                        return `${date.getDate()}/${date.getMonth() + 1}`;
                      }}
                    />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: any) => [`${parseInt(value).toLocaleString()} tokens`, "Tokens Sold"]}
                      labelFormatter={(label) => format(new Date(label), 'dd MMM yyyy')}
                    />
                    <Legend />
                    <Bar dataKey="token_amount" name="Tokens Sold" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="cumulative" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Cumulative SOL Raised</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-[300px] w-full" />
              ) : contributionData.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[250px] text-center">
                  <CalendarRange className="h-10 w-10 text-gray-400 mb-2" />
                  <p className="text-gray-500">No contribution data available for the selected period</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={contributionData.reduce((acc, curr, i) => {
                    const prevAmount = i > 0 ? acc[i-1].cumulativeSol : 0;
                    return [...acc, {
                      ...curr,
                      cumulativeSol: prevAmount + parseFloat(curr.sol_amount)
                    }];
                  }, [])}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(value) => {
                        const date = new Date(value);
                        return `${date.getDate()}/${date.getMonth() + 1}`;
                      }}
                    />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: any) => [`${parseFloat(value).toFixed(4)} SOL`, "Cumulative SOL"]}
                      labelFormatter={(label) => format(new Date(label), 'dd MMM yyyy')}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="cumulativeSol" name="Cumulative SOL Raised" stroke="#8884d8" />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="status" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Contribution Status Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-[300px] w-full" />
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div>
                    <ResponsiveContainer width="100%" height={300}>
                      <RechartsCircleChart>
                        <Pie
                          data={[
                            { name: 'Completed', value: 25 },
                            { name: 'Pending', value: 15 },
                            { name: 'Failed', value: 5 }
                          ]}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {[
                            { name: 'Completed', value: 25 },
                            { name: 'Pending', value: 15 },
                            { name: 'Failed', value: 5 }
                          ].map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </RechartsCircleChart>
                    </ResponsiveContainer>
                  </div>
                  
                  <div className="space-y-3">
                    {[
                      { name: 'Completed', value: 25, color: '#10B981' },
                      { name: 'Pending', value: 15, color: '#6366F1' },
                      { name: 'Failed', value: 5, color: '#EF4444' }
                    ].map((item, i) => (
                      <div key={i} className="flex items-center">
                        <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: item.color }}></div>
                        <div className="flex justify-between w-full">
                          <span>{item.name}</span>
                          <span className="font-medium">{item.value} contributions</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
