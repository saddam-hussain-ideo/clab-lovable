
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Clock, RefreshCw, Settings } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { UpdateTransactionsButton } from "./UpdateTransactionsButton";
import { formatDistanceToNow } from "date-fns";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";

export const TransactionUpdateStatus = () => {
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [nextScheduledUpdate, setNextScheduledUpdate] = useState<Date | null>(null);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [configuring, setConfiguring] = useState(false);

  // Calculate the next scheduled update time (now every 15 minutes)
  useEffect(() => {
    const now = new Date();
    const nextQuarterHour = new Date(now);
    const minutes = nextQuarterHour.getMinutes();
    const remainder = minutes % 15;
    
    nextQuarterHour.setMinutes(minutes + (15 - remainder));
    nextQuarterHour.setSeconds(0);
    nextQuarterHour.setMilliseconds(0);
    
    setNextScheduledUpdate(nextQuarterHour);
  }, []);

  const fetchUpdateHistory = async () => {
    setRefreshing(true);
    try {
      // Get recently updated transactions
      const { data, error } = await supabase
        .from('presale_contributions')
        .select('*')
        .in('status', ['confirmed', 'completed'])
        .order('updated_at', { ascending: false })
        .limit(5);

      if (error) throw error;

      if (data && data.length > 0) {
        setRecentActivity(data);
        // Set last updated time to the most recent update
        setLastUpdated(new Date(data[0].updated_at));
      }
    } catch (error) {
      console.error("Error fetching update history:", error);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUpdateHistory();
    // Set up a refresh every 5 minutes
    const interval = setInterval(fetchUpdateHistory, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    fetchUpdateHistory();
  };

  const handleSuccessfulUpdate = () => {
    // Set the last updated time to now and refresh the activity list
    setLastUpdated(new Date());
    fetchUpdateHistory();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500 hover:bg-green-600';
      case 'confirmed': return 'bg-blue-500 hover:bg-blue-600';
      case 'pending': return 'bg-yellow-500 hover:bg-yellow-600';
      default: return 'bg-gray-500 hover:bg-gray-600';
    }
  };

  const setupCronJob = async () => {
    setConfiguring(true);
    try {
      toast.info("Setting up 15-minute update schedule...");
      
      const { data, error } = await supabase.functions.invoke('setup-contribution-cron');
      
      if (error) throw error;
      
      toast.success("Transaction updates will now run every 15 minutes");
      // Update the next scheduled time
      const now = new Date();
      const nextQuarterHour = new Date(now);
      const minutes = nextQuarterHour.getMinutes();
      const remainder = minutes % 15;
      
      nextQuarterHour.setMinutes(minutes + (15 - remainder));
      nextQuarterHour.setSeconds(0);
      nextQuarterHour.setMilliseconds(0);
      
      setNextScheduledUpdate(nextQuarterHour);
    } catch (error) {
      console.error('Error setting up cron job:', error);
      toast.error('Failed to set up automatic update schedule. Please try again later.');
    } finally {
      setConfiguring(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">Transaction Processing Status</CardTitle>
        <CardDescription>
          Recent transaction updates and scheduled jobs
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <div className="text-sm font-medium mb-1">Last Updated</div>
              {lastUpdated ? (
                <div className="text-sm">{formatDistanceToNow(lastUpdated, { addSuffix: true })}</div>
              ) : (
                <div className="text-sm text-gray-500">No recent updates</div>
              )}
            </div>
            
            <div>
              <div className="text-sm font-medium mb-1">Next Scheduled Run</div>
              {nextScheduledUpdate ? (
                <div className="flex items-center text-sm">
                  <Clock className="h-3 w-3 mr-1" />
                  {formatDistanceToNow(nextScheduledUpdate, { addSuffix: true })}
                </div>
              ) : (
                <div className="text-sm text-gray-500">Unknown</div>
              )}
            </div>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh}
              disabled={refreshing}
            >
              {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            </Button>
          </div>
          
          <Alert variant="info" className="bg-blue-950/30 border-blue-800/50">
            <AlertDescription>
              Transactions are automatically processed every 15 minutes and daily at midnight.
            </AlertDescription>
          </Alert>
          
          <div className="mt-4">
            <div className="text-sm font-medium mb-2">Recent Activity</div>
            {loading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
              </div>
            ) : recentActivity.length > 0 ? (
              <div className="space-y-2">
                {recentActivity.map((tx) => (
                  <div key={tx.id} className="flex justify-between items-center p-2 bg-gray-900/50 rounded border border-gray-800">
                    <div className="truncate max-w-[120px] text-xs">{tx.wallet_address}</div>
                    <Badge className={getStatusColor(tx.status)}>{tx.status}</Badge>
                    <div className="text-xs text-gray-400">
                      {formatDistanceToNow(new Date(tx.updated_at), { addSuffix: true })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500 text-sm">No recent activity</div>
            )}
          </div>
          
          <div className="mt-4 pt-4 border-t border-gray-800">
            <div className="flex justify-between items-center mb-2">
              <div className="text-sm font-medium">Manual Processing</div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={setupCronJob} 
                disabled={configuring}
                className="ml-2"
              >
                {configuring ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Settings className="h-3 w-3 mr-1" />}
                Configure 15-min Updates
              </Button>
            </div>
            <UpdateTransactionsButton 
              onSuccess={handleSuccessfulUpdate} 
              variant="secondary" 
              size="sm"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
