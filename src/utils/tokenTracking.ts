import { supabase } from "@/lib/supabase";
import { logDebug, logCriticalTokenIssue, forceLog } from "./debugLogging";

// Check if we're in development mode
const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * Log token amount at critical points in the purchase flow
 * Both client-side and to the server for debugging
 * Production-safe version - minimal logging in production
 */
export async function trackTokenAmount(
  tokenAmount: number,
  source: string,
  walletAddress: string,
  recordId?: string | null,
  currency?: string,
  paymentAmount?: number
) {
  // In production, only log to the server with minimal client-side logging
  if (isDevelopment) {
    // Log locally with multiple methods to ensure visibility
    logDebug('TOKEN_TRACKING', `Amount: ${tokenAmount} at ${source} for wallet ${walletAddress}`);
    logCriticalTokenIssue('TOKEN_TRACKING', `Amount: ${tokenAmount} at ${source} for ${walletAddress}`);
    forceLog(`TOKEN_AMOUNT: ${tokenAmount} at ${source}`, { wallet: walletAddress, recordId });
  }
  
  // Create a fingerprint for this tracking event
  const trackingId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  
  // Send to server for centralized tracking (keep this for both dev and prod for audit purposes)
  try {
    await supabase.functions.invoke('token-amount-debug', {
      body: {
        wallet: walletAddress,
        tokenAmount,
        source,
        recordId,
        currency,
        paymentAmount,
        trackingId,
        isConsistent: true // Mark as consistent in production
      }
    });
    
    if (isDevelopment) {
      console.log(`Token amount (${tokenAmount}) successfully logged to server from ${source} with ID ${trackingId}`);
    }
  } catch (error) {
    if (isDevelopment) {
      console.error('Failed to log token amount to server:', error);
      // Even if server logging fails, ensure we have a local record
      forceLog(`SERVER_LOG_FAILED: ${tokenAmount} at ${source}`, { wallet: walletAddress, error });
    }
  }
  
  // In development, also store in localStorage as an additional backup
  if (isDevelopment) {
    try {
      const storedLogs = JSON.parse(localStorage.getItem('tokenAmountLogs') || '[]');
      storedLogs.push({
        timestamp: new Date().toISOString(),
        tokenAmount,
        source,
        walletAddress,
        recordId,
        trackingId
      });
      localStorage.setItem('tokenAmountLogs', JSON.stringify(storedLogs.slice(-10))); // Keep last 10 logs
    } catch (e) {
      console.error('Failed to store token tracking in localStorage:', e);
    }
  }
}

/**
 * Log and explain token amount discrepancy
 * Production-safe version - minimal logging in production
 */
export function logTokenDiscrepancy(
  expectedAmount: number,
  actualAmount: number,
  source: string,
  reason?: string
) {
  const diff = actualAmount - expectedAmount;
  const percentDiff = (diff / expectedAmount) * 100;
  
  if (isDevelopment) {
    const message = `DISCREPANCY at ${source}: Expected ${expectedAmount}, Got ${actualAmount}, ` + 
      `Diff: ${diff.toFixed(6)} (${percentDiff.toFixed(2)}%)` +
      (reason ? ` - Reason: ${reason}` : '');
    
    logDebug('TOKEN_DISCREPANCY', message);
    logCriticalTokenIssue('TOKEN_DISCREPANCY', message);
    forceLog(`TOKEN_DISCREPANCY: ${message}`);
    
    // Store in localStorage
    try {
      const storedDiscrepancies = JSON.parse(localStorage.getItem('tokenDiscrepancies') || '[]');
      storedDiscrepancies.push({
        timestamp: new Date().toISOString(),
        expectedAmount,
        actualAmount,
        diff,
        percentDiff,
        source,
        reason
      });
      localStorage.setItem('tokenDiscrepancies', JSON.stringify(storedDiscrepancies.slice(-10))); // Keep last 10 logs
    } catch (e) {
      console.error('Failed to store token discrepancy in localStorage:', e);
    }
  } else {
    // In production, just log minimal discrepancy without specific values
    console.warn(`Token amount discrepancy detected at ${source}`);
  }
}

/**
 * Get token amount logs from localStorage
 * Only available in development
 */
export function getTokenAmountLogs() {
  if (!isDevelopment) return []; // No logs in production
  
  try {
    return JSON.parse(localStorage.getItem('tokenAmountLogs') || '[]');
  } catch (e) {
    console.error('Failed to retrieve token logs from localStorage:', e);
    return [];
  }
}

/**
 * Get token discrepancies from localStorage
 * Only available in development
 */
export function getTokenDiscrepancies() {
  if (!isDevelopment) return []; // No logs in production
  
  try {
    return JSON.parse(localStorage.getItem('tokenDiscrepancies') || '[]');
  } catch (e) {
    console.error('Failed to retrieve token discrepancies from localStorage:', e);
    return [];
  }
}

/**
 * Clear token logs from localStorage
 */
export function clearTokenLogs() {
  localStorage.removeItem('tokenAmountLogs');
  localStorage.removeItem('tokenDiscrepancies');
}

/**
 * Add handler to intercept any rounding or changes to token amounts
 * Production-safe version - minimal monitoring in production
 */
export function monitorTokenChanges() {
  if (!isDevelopment) return; // Don't monitor in production
  
  // Monitor localStorage changes
  const originalSetItem = localStorage.setItem;
  localStorage.setItem = function(key, value) {
    if (key === 'displayedTokenAmount' || key === 'lockedTokenAmount') {
      forceLog(`localStorage.setItem('${key}', '${value}')`);
    }
    originalSetItem.call(this, key, value);
  };
  
  // Add global error handler to catch any issues related to token amounts
  window.addEventListener('error', function(event) {
    if (event.message && event.message.includes('token')) {
      forceLog(`ERROR caught: ${event.message}`, event.error);
    }
  });
  
  console.log('Token amount monitoring initialized (development mode)');
}
