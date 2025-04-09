
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CryptoTickerManager } from "./CryptoTickerManager";
import { ApiKeyManager } from "./ApiKeyManager";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { updateSiteSetting } from "@/utils/settings/siteSettings";

export const TickerManager = () => {
  const [tickerText, setTickerText] = useState("");
  const [isTickerEnabled, setIsTickerEnabled] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch both ticker text and enabled state
  const { data: tickerSettings, isLoading, refetch } = useQuery({
    queryKey: ['ticker-settings'],
    queryFn: async () => {
      console.log("Admin: Fetching ticker settings...");
      const { data, error } = await supabase
        .from('site_settings')
        .select('key, value')
        .in('key', ['ticker_text', 'ticker_enabled']);
      
      if (error) {
        console.error("Admin: Error fetching ticker settings:", error);
        throw error;
      }
      
      console.log("Admin: Raw ticker settings data:", data);
      
      const settings: Record<string, string> = {};
      data?.forEach(item => {
        settings[item.key] = item.value;
      });
      
      // Set state based on fetched values
      const text = settings.ticker_text || "🚀 CLAB PRESALE ENDING SOON";
      const enabled = settings.ticker_enabled === 'true';
      
      console.log("Admin: Fetched ticker settings - Text:", text, "Enabled:", enabled);
      
      setTickerText(text);
      setIsTickerEnabled(enabled);
      
      return { text, enabled };
    },
    staleTime: 1000, // Very short stale time for quick updates
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    console.log("Admin: Starting ticker update process");

    try {
      console.log("Admin: Updating ticker settings - Text:", tickerText, "Enabled:", isTickerEnabled);
      
      // Use our new utility function to update settings
      const textResult = await updateSiteSetting('ticker_text', tickerText);
      console.log("Admin: Text update result:", textResult);
      
      if (!textResult.success) {
        throw textResult.error;
      }
      
      const enabledResult = await updateSiteSetting('ticker_enabled', isTickerEnabled.toString());
      console.log("Admin: Enabled state update result:", enabledResult);
      
      if (!enabledResult.success) {
        throw enabledResult.error;
      }
      
      toast({
        title: "Success",
        description: "Ticker settings have been updated",
      });
      
      // Invalidate all ticker-related queries to force a refetch
      console.log("Admin: Invalidating ticker-related queries");
      queryClient.invalidateQueries({ queryKey: ['ticker-text'] });
      queryClient.invalidateQueries({ queryKey: ['ticker-settings'] });
      
      // Force immediate refetch
      await refetch();
      
      // Add a slight delay then invalidate again to ensure changes propagate
      setTimeout(() => {
        console.log("Admin: Second invalidation after delay");
        queryClient.invalidateQueries({ queryKey: ['ticker-text'] });
        queryClient.invalidateQueries({ queryKey: ['ticker-settings'] });
      }, 1000);
    } catch (error) {
      console.error('Admin: Error updating ticker settings:', error);
      toast({
        title: "Error",
        description: "Failed to update ticker settings",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Helper function to update a setting - refactored to use upsert
  const upsertSetting = async (key: string, value: string) => {
    console.log(`Admin: Upserting ${key} to ${value}`);
    
    const { data, error } = await supabase
      .from('site_settings')
      .upsert({ 
        key,
        value,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'key'
      });
      
    if (error) {
      console.error(`Admin: Error upserting ${key}:`, error);
      throw error;
    }
    
    console.log(`Admin: Successfully upserted ${key} to ${value}`);
    return { success: true, key, value };
  };

  // This is for debugging - check if settings change
  useEffect(() => {
    if (tickerSettings) {
      console.log("Admin: Current ticker settings in component:", tickerSettings);
    }
  }, [tickerSettings]);

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <Tabs defaultValue="text" className="w-full">
      <TabsList className="mb-4 bg-gray-900">
        <TabsTrigger value="text" className="data-[state=active]:bg-purple-900">
          Ticker Text
        </TabsTrigger>
        <TabsTrigger value="crypto" className="data-[state=active]:bg-purple-900">
          Crypto Ticker
        </TabsTrigger>
        <TabsTrigger value="api-keys" className="data-[state=active]:bg-purple-900">
          API Keys
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="text">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <h2 className="text-lg font-semibold">Ticker Settings</h2>
            <p className="text-sm text-gray-500">
              Update the text that appears in the scrolling ticker on the homepage and control its visibility.
            </p>
            
            <div className="p-4 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 rounded-md border border-yellow-200 dark:border-yellow-800 mb-4">
              <p className="text-sm font-medium">Current Settings</p>
              <p className="text-xs mt-1">
                Status: {isTickerEnabled ? "Visible" : "Hidden"} | 
                Text: {tickerText || "(empty)"}
              </p>
            </div>
            
            <div className="flex items-center space-x-4 py-2">
              <Switch 
                id="ticker-enabled"
                checked={isTickerEnabled}
                onCheckedChange={(checked) => {
                  console.log("Admin: Switch toggled to:", checked);
                  setIsTickerEnabled(checked);
                }}
              />
              <Label htmlFor="ticker-enabled" className="cursor-pointer">
                {isTickerEnabled ? "Ticker is visible" : "Ticker is hidden"}
              </Label>
            </div>
            
            <Input
              value={tickerText}
              onChange={(e) => setTickerText(e.target.value)}
              placeholder="Enter ticker text"
              className="max-w-xl bg-gray-800 border-gray-700"
              disabled={!isTickerEnabled}
            />
          </div>
          <Button type="submit" disabled={isSubmitting} className="bg-purple-700 hover:bg-purple-800">
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </form>
      </TabsContent>
      
      <TabsContent value="crypto">
        <CryptoTickerManager />
      </TabsContent>
      
      <TabsContent value="api-keys">
        <ApiKeyManager />
      </TabsContent>
    </Tabs>
  );
};
