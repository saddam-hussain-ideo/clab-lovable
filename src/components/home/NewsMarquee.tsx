
import { useEffect, useState, memo, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useQuery } from "@tanstack/react-query";
import { logDebug } from "@/utils/debugLogging";

// Define the type for the site settings data
type SiteSettings = {
  value: string;
  key: string;
  id?: string;
}

// Create a memoized version of the component to prevent unnecessary re-renders
export const NewsMarquee = memo(({ text: initialText }: { text: string }) => {
  const [tickerText, setTickerText] = useState<string>(initialText || "🚀 CLAB PRESALE NOW OPEN!");
  const [isVisible, setIsVisible] = useState(true); // Default to visible

  // Fetch ticker text with React Query to handle caching properly
  const { data: tickerData } = useQuery({
    queryKey: ['ticker-text'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('site_settings')
          .select('value, key')
          .in('key', ['ticker_text', 'ticker_enabled']);
        
        if (error) {
          logDebug("TICKER", "Error fetching ticker text", { error });
          return { tickerText: initialText || "🚀 CLAB PRESALE NOW OPEN!", isEnabled: true };
        }
        
        // Find the ticker text and enabled state from results
        const textSetting = data?.find(item => item.key === 'ticker_text');
        const enabledSetting = data?.find(item => item.key === 'ticker_enabled');
        
        // Ensure we're handling the enabled state correctly - must be exactly 'true' string
        const isEnabled = enabledSetting?.value === 'true';
        
        // Ensure ticker text is always a string
        let finalText = "🚀 CLAB PRESALE NOW OPEN!"; // Default fallback
        
        if (textSetting?.value && typeof textSetting.value === 'string') {
          finalText = textSetting.value;
        } else if (initialText && typeof initialText === 'string') {
          finalText = initialText;
        }
        
        return {
          tickerText: finalText,
          isEnabled: isEnabled
        };
      } catch (error) {
        logDebug("TICKER", "Unexpected error in ticker fetch", { error });
        return { tickerText: initialText || "🚀 CLAB PRESALE NOW OPEN!", isEnabled: true };
      }
    },
    staleTime: 60000,           // Cache results for 1 minute
    refetchInterval: 300000,    // Refetch every 5 minutes instead of every minute
    refetchOnWindowFocus: false, // Don't refetch on focus to reduce state changes
  });

  // Update ticker text and visibility when data changes
  useEffect(() => {
    if (tickerData) {
      setTickerText(tickerData.tickerText);
      setIsVisible(tickerData.isEnabled);
    }
  }, [tickerData]);

  // Setup Supabase realtime subscription with improved error handling
  const setupTickerSubscription = useCallback(() => {
    try {
      // Set up subscription for ticker text changes
      const tickerChannel = supabase
        .channel('ticker-settings-changes')
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'site_settings',
          filter: 'key=in.(ticker_text,ticker_enabled)'
        }, (payload) => {
          try {
            // Type the payload to ensure TypeScript knows about the structure
            const newData = payload.new as SiteSettings;
            if (newData && newData.key && newData.value !== undefined) {
              if (newData.key === 'ticker_text') {
                setTickerText(newData.value);
              } else if (newData.key === 'ticker_enabled') {
                const isEnabled = newData.value === 'true';
                setIsVisible(isEnabled);
              }
            }
          } catch (innerError) {
            console.error("Error in ticker subscription handler:", innerError);
          }
        })
        .subscribe((status) => {
          if (status !== 'SUBSCRIBED') {
            logDebug("TICKER", "Ticker subscription status", { status });
          }
        });

      return tickerChannel;
    } catch (error) {
      console.error("Error setting up ticker subscription:", error);
      return null;
    }
  }, []);

  // Subscribe to real-time changes on the site_settings table
  // with improved cleanup and error handling to prevent memory leaks
  useEffect(() => {
    let tickerChannel = setupTickerSubscription();
    
    return () => {
      if (tickerChannel) {
        try {
          supabase.removeChannel(tickerChannel);
        } catch (error) {
          console.error("Error removing ticker subscription:", error);
        }
      }
    };
  }, [setupTickerSubscription]);

  // If ticker is disabled, don't render anything
  if (!isVisible) {
    return null;
  }

  // Ensure ticker text is a string
  const finalDisplayText = typeof tickerText === 'string' ? tickerText : "🚀 CLAB PRESALE NOW OPEN!";
  
  return (
    <div className="w-full overflow-hidden bg-black/50 backdrop-blur-lg border-t border-b border-white/10 hidden md:block">
      <div className="relative overflow-hidden h-14">
        {/* Reduced number of text repeats from 4 to 3 and increased spacing further */}
        <div className="flex whitespace-nowrap h-full items-center animate-marquee">
          {[...Array(3)].map((_, index) => (
            <span 
              key={index} 
              className="inline-flex items-center text-[1.5em] font-bold mx-24 bg-gradient-to-r from-[#D946EF] to-[#9b87f5] bg-clip-text text-transparent"
              style={{ width: 'max-content' }}
            >
              {finalDisplayText}
            </span>
          ))}
        </div>
        <div className="flex absolute top-0 left-0 whitespace-nowrap h-full items-center animate-marquee2">
          {[...Array(3)].map((_, index) => (
            <span 
              key={index} 
              className="inline-flex items-center text-[1.5em] font-bold mx-24 bg-gradient-to-r from-[#D946EF] to-[#9b87f5] bg-clip-text text-transparent"
              style={{ width: 'max-content' }}
            >
              {finalDisplayText}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
});

// Add explicit displayName for debugging
NewsMarquee.displayName = 'NewsMarquee';
