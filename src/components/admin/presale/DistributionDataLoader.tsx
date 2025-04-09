
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { tokenDistributionService } from '@/services/tokenDistributionService';
import { RefreshCw, Download, Loader2, Database } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { formatNumberWithCommas } from '@/utils/helpers';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';

interface DistributionDataLoaderProps {
  activeNetwork: string;
  onDataLoaded: (data: any[], stageId: number | null) => void;
  onStageChange?: (stageId: number | null) => void;
  selectedStageId: number | null;
}

export function DistributionDataLoader({ 
  activeNetwork, 
  onDataLoaded, 
  onStageChange,
  selectedStageId 
}: DistributionDataLoaderProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [stages, setStages] = useState<any[]>([]);
  const [distributionStats, setDistributionStats] = useState<any>({
    pending: { count: 0, total: 0, distributions: [] },
    distributed: { count: 0, total: 0 },
    total: { count: 0, total: 0 }
  });
  const [displayedContributions, setDisplayedContributions] = useState<number>(5);

  useEffect(() => {
    const fetchStages = async () => {
      try {
        const data = await tokenDistributionService.fetchPresaleStages(activeNetwork);
        
        if (data && Array.isArray(data)) {
          setStages(data);
          console.log("Fetched stages:", data);
        }
      } catch (error) {
        console.error('Error fetching presale stages:', error);
      }
    };
    
    fetchStages();
  }, [activeNetwork]);

  const loadDistributionData = async () => {
    setIsLoading(true);
    
    try {
      console.log(`Loading distribution data with stage filter: ${selectedStageId || 'all'}`);
      
      const stats = await tokenDistributionService.getDistributionStats(
        activeNetwork, 
        selectedStageId
      );
      
      console.log("Distribution stats loaded:", stats);
      
      if (!stats || !stats.pending || !Array.isArray(stats.pending.distributions)) {
        console.warn("Invalid stats data structure:", stats);
        toast.warning('Received invalid data structure from server');
        setDistributionStats({
          pending: { count: 0, total: 0, distributions: [] },
          distributed: { count: 0, total: 0 },
          total: { count: 0, total: 0 }
        });
        onDataLoaded([], selectedStageId);
        return;
      }
      
      setDistributionStats(stats);
      setDisplayedContributions(5);
      
      if (stats && stats.pending && Array.isArray(stats.pending.distributions)) {
        console.log(`Loaded ${stats.pending.distributions.length} pending distributions for stage ${selectedStageId || 'all'}`);
        onDataLoaded(stats.pending.distributions, selectedStageId);
      } else {
        console.warn("No pending distributions found in stats", stats);
        onDataLoaded([], selectedStageId);
      }
      
      toast.success('Distribution data loaded successfully');
    } catch (error) {
      console.error('Error loading distribution data:', error);
      toast.error('Failed to load distribution data');
      onDataLoaded([], selectedStageId);
    } finally {
      setIsLoading(false);
    }
  };

  // Load data initially
  useEffect(() => {
    loadDistributionData();
  }, [activeNetwork, selectedStageId]);

  const handleStageChange = (value: string) => {
    const stageId = value === 'all' ? null : parseInt(value);
    if (onStageChange) {
      onStageChange(stageId);
    }
    console.log(`Stage changed to: ${stageId || 'all'}`);
  };

  const loadMoreContributions = () => {
    setDisplayedContributions(prevCount => prevCount + 5);
  };

  const exportToCSV = () => {
    if (!distributionStats.pending.distributions || distributionStats.pending.distributions.length === 0) {
      toast.error('No data to export');
      return;
    }
    
    try {
      const csvContent = distributionStats.pending.distributions
        .map(item => `${item.address},${item.amount}`)
        .join('\n');
        
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      
      link.setAttribute('href', url);
      link.setAttribute('download', `pending_distributions_${activeNetwork}_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('CSV exported successfully');
    } catch (error) {
      console.error('Error exporting CSV:', error);
      toast.error('Failed to export CSV');
    }
  };

  const safeFormat = (num: number | null | undefined): string => {
    if (num === null || num === undefined) return '0';
    return formatNumberWithCommas(num);
  };

  return (
    <Card className="w-full border-zinc-700 bg-zinc-900 shadow-md mt-4">
      <CardHeader>
        <div className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-zinc-100">Distribution Data</CardTitle>
            <CardDescription className="text-zinc-400">
              Load token distribution data
            </CardDescription>
          </div>
          
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-1 bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700 hover:text-zinc-200"
            onClick={loadDistributionData}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            <span>Refresh</span>
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-lg bg-zinc-800/60 p-4 text-center space-y-1">
            <div className="text-sm text-zinc-400">Pending</div>
            <div className="text-2xl font-bold text-zinc-100">{distributionStats.pending?.count || 0}</div>
            <div className="text-sm text-zinc-300">{safeFormat(distributionStats.pending?.total)} tokens</div>
          </div>
          
          <div className="rounded-lg bg-zinc-800/60 p-4 text-center space-y-1">
            <div className="text-sm text-zinc-400">Distributed</div>
            <div className="text-2xl font-bold text-green-500">{distributionStats.distributed?.count || 0}</div>
            <div className="text-sm text-zinc-300">{safeFormat(distributionStats.distributed?.total)} tokens</div>
          </div>
          
          <div className="rounded-lg bg-zinc-800/60 p-4 text-center space-y-1">
            <div className="text-sm text-zinc-400">Total</div>
            <div className="text-2xl font-bold text-zinc-100">{distributionStats.total?.count || 0}</div>
            <div className="text-sm text-zinc-300">{safeFormat(distributionStats.total?.total)} tokens</div>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <div className="flex-1">
            <Select
              value={selectedStageId ? selectedStageId.toString() : 'all'}
              onValueChange={handleStageChange}
            >
              <SelectTrigger className="w-full bg-zinc-800 text-zinc-300 border-zinc-700">
                <SelectValue placeholder="All Stages" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-800 border-zinc-700 text-zinc-300">
                <SelectItem value="all" className="text-zinc-300 hover:bg-zinc-700">All Stages</SelectItem>
                {stages.map(stage => (
                  <SelectItem key={stage.id} value={stage.id.toString()} className="text-zinc-300 hover:bg-zinc-700">
                    {stage.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <Button 
            variant="default" 
            className="bg-purple-600 hover:bg-purple-700 text-white gap-2"
            onClick={loadDistributionData}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Database className="h-4 w-4" />
            )}
            <span>Load Data</span>
          </Button>
          
          <Button 
            variant="outline"
            className="bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700 hover:text-zinc-200"
            onClick={exportToCSV}
            disabled={isLoading || !distributionStats.pending?.distributions || distributionStats.pending.distributions.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            <span>Export CSV</span>
          </Button>
        </div>
        
        {distributionStats.pending?.distributions && distributionStats.pending.distributions.length > 0 ? (
          <div className="mt-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-zinc-300">Pending Distributions Preview</span>
              <Badge variant="outline" className="bg-zinc-800 text-zinc-300">
                {distributionStats.pending.distributions.length} contributions
              </Badge>
            </div>
            
            <div className="bg-zinc-800 rounded-md overflow-hidden border border-zinc-700">
              <Table className="w-full">
                <TableHeader className="bg-zinc-800 border-b border-zinc-700">
                  <TableRow className="border-none hover:bg-zinc-700/50">
                    <TableHead className="text-zinc-300 font-medium h-10 px-4 py-2">Wallet</TableHead>
                    <TableHead className="text-zinc-300 font-medium text-right h-10 px-4 py-2">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {distributionStats.pending.distributions.slice(0, displayedContributions).map((item, index) => (
                    <TableRow key={index} className="border-t border-zinc-700 hover:bg-zinc-700/50">
                      <TableCell className="text-zinc-300 font-mono text-xs px-4 py-2">
                        {item.address ? `${item.address.substring(0, 8)}...${item.address.substring(item.address.length - 4)}` : 'Unknown'}
                      </TableCell>
                      <TableCell className="text-zinc-200 text-right font-medium px-4 py-2">
                        {item.amount ? safeFormat(Math.round(item.amount)) : '0'} tokens
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {distributionStats.pending.distributions.length > displayedContributions && (
                <div className="text-center py-2 border-t border-zinc-700 bg-zinc-800/80">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700"
                    onClick={loadMoreContributions}
                  >
                    + Load {Math.min(5, distributionStats.pending.distributions.length - displayedContributions)} more contributions
                  </Button>
                </div>
              )}
              {displayedContributions > 5 && distributionStats.pending.distributions.length <= displayedContributions && (
                <div className="text-center text-xs text-zinc-400 py-2 border-t border-zinc-700 bg-zinc-800/80">
                  All contributions loaded
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-zinc-400 bg-zinc-800/40 rounded-md border border-zinc-700 mt-4">
            No pending distributions found. Please check your filter settings or try refreshing the data.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
