
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Loader2, KeyRound, AlertCircle, Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { testCoinGeckoAPIKey } from "@/utils/wallet/ethereum";
import { updateSiteSetting, getSiteSetting } from "@/utils/settings/siteSettings";

export const ApiKeyManager = () => {
  const [coingeckoApiKey, setCoingeckoApiKey] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{success: boolean, message: string} | null>(null);
  const { toast } = useToast();
  const [lastTestTime, setLastTestTime] = useState<number>(0);
  const [cooldownRemaining, setCooldownRemaining] = useState<number>(0);

  const { data: apiKeyData, isLoading, refetch } = useQuery({
    queryKey: ['coingecko-api-key'],
    queryFn: async () => {
      try {
        console.log("Fetching CoinGecko API key from database...");
        const result = await getSiteSetting<string>('coingecko_api_key', '');
        console.log("API key fetch result:", result ? "Key found" : "No key found");
        
        if (result) {
          setCoingeckoApiKey(result);
          return result;
        }
        return "";
      } catch (error) {
        console.error("Error in API key query function:", error);
        return "";
      }
    },
  });

  // Debug logging for component state
  useEffect(() => {
    console.log("ApiKeyManager state:", { 
      hasApiKey: Boolean(coingeckoApiKey), 
      apiKeyLength: coingeckoApiKey?.length,
      isLoading
    });
  }, [coingeckoApiKey, isLoading]);

  // Cooldown timer for API testing
  useEffect(() => {
    if (cooldownRemaining <= 0) return;
    
    const interval = setInterval(() => {
      const newRemaining = Math.max(0, Math.floor((lastTestTime + 10000 - Date.now()) / 1000));
      setCooldownRemaining(newRemaining);
    }, 1000);
    
    return () => clearInterval(interval);
  }, [lastTestTime, cooldownRemaining]);

  const saveApiKey = async (): Promise<boolean> => {
    if (!coingeckoApiKey) {
      toast({
        title: "Error",
        description: "Please enter an API key",
        variant: "destructive",
      });
      return false;
    }

    try {
      console.log("Saving API key to database:", coingeckoApiKey?.substring(0, 4) + "***");
      
      // Use the updateSiteSetting utility which handles upserts properly
      const { success, error } = await updateSiteSetting('coingecko_api_key', coingeckoApiKey);
      
      if (!success || error) {
        throw new Error(`Database error: ${error?.message || 'Unknown error'}`);
      }

      console.log("API key save result:", success);

      // Also ensure crypto_ticker_enabled is set to true
      const enableResult = await updateSiteSetting('crypto_ticker_enabled', 'true');
      
      if (!enableResult.success) {
        console.warn("Failed to update crypto_ticker_enabled setting:", enableResult.error);
      }

      toast({
        title: "Success",
        description: "CoinGecko API key has been saved",
      });
      
      await refetch();
      
      // Trigger a refresh of crypto prices
      if (typeof window !== 'undefined' && typeof window.triggerCryptoPriceRefresh === 'function') {
        window.triggerCryptoPriceRefresh();
        toast({
          title: "Price Update",
          description: "Triggered refresh of cryptocurrency prices",
        });
      }
      
      return true;
      
    } catch (error) {
      console.error('Error updating CoinGecko API key:', error);
      toast({
        title: "Error",
        description: "Failed to update CoinGecko API key",
        variant: "destructive",
      });
      return false;
    }
  };

  const testApiKey = async () => {
    // Check cooldown
    const now = Date.now();
    const timeSinceLastTest = now - lastTestTime;
    
    if (timeSinceLastTest < 10000) { // 10 seconds cooldown
      const remainingSeconds = Math.ceil((10000 - timeSinceLastTest) / 1000);
      
      toast({
        title: "Rate Limit Protection",
        description: `Please wait ${remainingSeconds} seconds before testing again to avoid CoinGecko rate limits`,
        variant: "default",
      });
      
      setCooldownRemaining(remainingSeconds);
      return;
    }

    if (!coingeckoApiKey) {
      setTestResult({
        success: false,
        message: "Please enter an API key to test"
      });
      return;
    }

    setIsTesting(true);
    setTestResult(null);
    setLastTestTime(now);
    setCooldownRemaining(10); // Start 10 second cooldown

    try {
      // First ensure we save the API key to the database
      console.log("Saving API key before testing...");
      const saveResult = await saveApiKey();
      
      if (!saveResult) {
        throw new Error("Failed to save API key before testing");
      }

      console.log("API key saved successfully, proceeding with test...");
      
      // Short delay to ensure database update has propagated
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Test directly with the API key we have
      console.log("Testing API key...");
      const testResult = await testCoinGeckoAPIKey(coingeckoApiKey);
      console.log("Test result:", testResult);

      setTestResult(testResult);

      if (testResult.success) {
        toast({
          title: "Success",
          description: "CoinGecko API key is valid",
        });
        
        // Trigger a refresh of crypto prices
        if (typeof window !== 'undefined' && typeof window.triggerCryptoPriceRefresh === 'function') {
          window.triggerCryptoPriceRefresh();
        }
      } else {
        let variant: "destructive" | "default" = "destructive";
        
        // Check if this is a rate limit issue
        if (testResult.message.includes('rate limit') || 
            testResult.message.includes('wait') || 
            testResult.message.includes('429')) {
          variant = "default"; // Less alarming for rate limit issues
        }
        
        toast({
          title: "API Key Test Failed",
          description: testResult.message,
          variant: variant,
        });
      }
    } catch (error) {
      console.error('Error testing CoinGecko API key:', error);
      setTestResult({
        success: false,
        message: `Operation error: ${error instanceof Error ? error.message : String(error)}`
      });
      
      toast({
        title: "Error",
        description: "Failed to test API key. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Save the API key
      await saveApiKey();
      
      // Refresh crypto prices if the global function exists
      if (typeof window !== 'undefined' && typeof window.triggerCryptoPriceRefresh === 'function') {
        window.triggerCryptoPriceRefresh();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">CoinGecko API Key</h2>
        <p className="text-sm text-gray-500">
          Enter your CoinGecko API key to get real-time cryptocurrency data. Without a valid API key, the app will use mock prices.
          You can get a free API key by signing up at <a href="https://www.coingecko.com/en/api/pricing" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">CoinGecko API Plans</a>.
        </p>
        
        <Alert variant="warning" className="bg-amber-900/20 border-amber-800/30 my-2">
          <Info className="h-4 w-4" />
          <AlertDescription>
            CoinGecko has strict rate limits. Free plans allow only 10-30 calls per minute. 
            You may need to wait between tests to avoid hitting these limits.
          </AlertDescription>
        </Alert>
        
        <div className="flex gap-2">
          <KeyRound className="h-4 w-4 mt-3 text-gray-400" />
          <Input
            value={coingeckoApiKey}
            onChange={(e) => setCoingeckoApiKey(e.target.value)}
            placeholder="Enter your CoinGecko API key"
            className="max-w-xl bg-gray-800 border-gray-700"
            type="password"
          />
        </div>
      </div>

      {testResult && (
        <Alert variant={testResult.success ? "default" : "destructive"} className={testResult.success ? "bg-green-900/20 border-green-800/30" : ""}>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {testResult.message}
          </AlertDescription>
        </Alert>
      )}

      <div className="flex gap-3">
        <Button 
          type="button" 
          variant="outline" 
          onClick={testApiKey} 
          disabled={isTesting || !coingeckoApiKey || cooldownRemaining > 0}
        >
          {isTesting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Testing...
            </>
          ) : cooldownRemaining > 0 ? (
            `Wait ${cooldownRemaining}s`
          ) : (
            "Test API Key"
          )}
        </Button>

        <Button type="submit" disabled={isSubmitting} className="bg-purple-700 hover:bg-purple-800">
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save API Key"
          )}
        </Button>
      </div>
      
      <div className="mt-4 p-4 bg-black/40 rounded-lg border border-gray-800">
        <h3 className="text-md font-medium text-white mb-2">Your API Key</h3>
        <p className="text-sm text-gray-400 mb-2">
          The API Key below is pre-populated for you to use. Click "Save API Key" to store it in the database.
        </p>
        <div className="flex items-center gap-2">
          <code className="bg-gray-800 px-3 py-1 rounded text-green-400">CG-FsnSA6qb7gmgiWD1qmZNGeLu</code>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setCoingeckoApiKey("CG-FsnSA6qb7gmgiWD1qmZNGeLu");
              toast({
                title: "API Key Set",
                description: "Your CoinGecko API key has been filled in. Click Save to store it.",
              });
            }}
            className="text-xs"
          >
            Use This Key
          </Button>
        </div>
      </div>
    </form>
  );
};
