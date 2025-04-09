
import { logDebug } from "@/utils/debugLogging";

export const CryptoTicker = () => {
  // Log that we're skipping render
  logDebug("CryptoTicker", "CryptoTicker is disabled, not rendering");
  
  // Return null instead of the ticker UI
  return null;
};
