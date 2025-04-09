
import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { logDebug } from "@/utils/debugLogging";

export const CryptoTicker = () => {
  useEffect(() => {
    // Completely disable the crypto ticker by updating the database setting
    const disableCryptoTicker = async () => {
      try {
        logDebug("CryptoTicker", "Disabling crypto ticker in database");
        await supabase
          .from('site_settings')
          .upsert({ 
            key: 'crypto_ticker_enabled', 
            value: 'false' 
          });
        logDebug("CryptoTicker", "Crypto ticker disabled in database");
      } catch (err) {
        logDebug("CryptoTicker", `Error disabling crypto ticker: ${err}`);
      }
    };
    
    disableCryptoTicker();
  }, []);

  // Return null to prevent rendering anything
  return null;
};
