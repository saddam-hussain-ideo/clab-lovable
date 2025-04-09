
/**
 * Debug logging utility for better visibility in console
 */

// Enable this to see all debug logs (set to false to disable most logging)
const DEBUG_ENABLED = true;

// Configure which modules to show logs for (empty = all)
const ENABLED_MODULES: string[] = ['WALLET', 'PURCHASE', 'ERROR', 'CONNECTION'];

// Specifically disable these modules
const DISABLED_MODULES: string[] = [
  'useCryptoPrices', 
  'CryptoTicker', 
  'PRESALE_SECTION', 
  'Input'
];

// Store log history for debug panels
const LOG_HISTORY: { category: string; message: string }[] = [];
const MAX_LOG_HISTORY = 100;

// Rate limiting to prevent excessive logging
const LOG_RATE_LIMITS: Record<string, number> = {};
const RATE_LIMIT_MS = 1000; // Only log once per second per module

// Track wallet connection events specifically
const WALLET_CONNECTION_EVENTS: {
  timestamp: number;
  event: string;
  address?: string;
  walletType?: string;
  connected?: boolean;
  source?: string;
}[] = [];
const MAX_WALLET_EVENTS = 30;

/**
 * Log debug information with module context
 * @param module Module name for filtering (e.g., "WALLET", "DISTRIBUTION")
 * @param message The message to log
 * @param data Additional data to log
 * @param forceLog Force logging even if module is disabled
 */
export function logDebug(module: string, message: string, data?: any, forceLog: boolean = false) {
  // Always track wallet events regardless of debug settings
  if (module === 'WALLET' || module.includes('WALLET') || message.includes('wallet')) {
    trackWalletEvent(message, data, module);
  }
  
  if (!DEBUG_ENABLED && !forceLog) {
    return;
  }
  
  // Skip logging for disabled modules unless forced
  if (!forceLog && DISABLED_MODULES.includes(module)) {
    return;
  }
  
  // Check if module is enabled (empty means all are enabled)
  if (!forceLog && ENABLED_MODULES.length > 0 && !ENABLED_MODULES.includes(module)) {
    return;
  }
  
  // Rate limiting check
  const now = Date.now();
  const lastLogTime = LOG_RATE_LIMITS[module] || 0;
  if (now - lastLogTime < RATE_LIMIT_MS && !forceLog) {
    return;
  }
  LOG_RATE_LIMITS[module] = now;
  
  const timestamp = new Date().toISOString().split('T')[1].replace('Z', '');
  const prefix = `[${timestamp}][${module}]`;
  
  // Store in history
  LOG_HISTORY.push({ category: module, message: `${prefix} ${message}` });
  if (LOG_HISTORY.length > MAX_LOG_HISTORY) {
    LOG_HISTORY.shift();
  }
  
  if (data !== undefined) {
    console.log(`${prefix} ${message}`, data);
  } else {
    console.log(`${prefix} ${message}`);
  }
}

/**
 * Track wallet connection events specifically
 */
function trackWalletEvent(message: string, data?: any, source: string = 'WALLET') {
  if (message.includes('connect') || message.includes('disconnect') || 
      message.includes('wallet') || message.includes('public key')) {
    
    const event = {
      timestamp: Date.now(),
      event: message,
      address: data?.address || data?.wallet || undefined,
      walletType: data?.walletType || data?.type || undefined,
      connected: data?.connected,
      source: source
    };
    
    WALLET_CONNECTION_EVENTS.push(event);
    
    if (WALLET_CONNECTION_EVENTS.length > MAX_WALLET_EVENTS) {
      WALLET_CONNECTION_EVENTS.shift();
    }
  }
}

/**
 * Get the log history for debug panels
 */
export function getLogHistory() {
  return [...LOG_HISTORY];
}

/**
 * Get wallet connection event history
 */
export function getWalletConnectionHistory() {
  return [...WALLET_CONNECTION_EVENTS];
}

/**
 * Log token amount with special highlighting
 * Helper for token-specific logging
 */
export function logTokenAmount(category: string, amount: number, context: string) {
  logDebug(category, `Token Amount: ${amount} - ${context}`);
}

/**
 * Log critical token issues that need immediate attention
 */
export function logCriticalTokenIssue(category: string, message: string) {
  logDebug(category, `⚠️ CRITICAL: ${message}`);
  console.warn(`[${category}] CRITICAL ISSUE: ${message}`);
}

/**
 * Force log a message even if DEBUG_ENABLED is false
 * Used for critical errors and important events
 */
export function forceLog(message: string, data?: any) {
  const timestamp = new Date().toISOString().split('T')[1].replace('Z', '');
  const prefix = `[${timestamp}][FORCE]`;
  
  // Always add to history
  LOG_HISTORY.push({ category: 'FORCE', message: `${prefix} ${message}` });
  if (LOG_HISTORY.length > MAX_LOG_HISTORY) {
    LOG_HISTORY.shift();
  }
  
  if (data !== undefined) {
    console.log(`${prefix} ${message}`, data);
  } else {
    console.log(`${prefix} ${message}`);
  }
}

/**
 * Check global wallet connection state
 * This is a convenience function to check if wallet is connected
 */
export function isWalletConnected(): boolean {
  try {
    const walletAddress = localStorage.getItem('walletAddress');
    const walletConnectedAt = localStorage.getItem('walletConnectedAt');
    
    if (!walletAddress || !walletConnectedAt) {
      return false;
    }
    
    // Check if connection timestamp is valid (not older than 24 hours)
    const connectedTime = parseInt(walletConnectedAt, 10);
    const now = Date.now();
    const dayInMs = 24 * 60 * 60 * 1000;
    
    if (isNaN(connectedTime) || now - connectedTime > dayInMs) {
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Error checking wallet connection state:", error);
    return false;
  }
}

/**
 * Trigger a global wallet verification
 * This will dispatch an event that components can listen to in order to verify their wallet connection
 */
export function triggerWalletVerification() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('verifyWalletConnection', {
      detail: { timestamp: Date.now() }
    }));
    
    logDebug('WALLET', 'Triggered global wallet verification check');
  }
}

/**
 * Set up global token logging for monitoring
 */
export function setupGlobalTokenLogging() {
  if (typeof window !== 'undefined') {
    // Initialize token logs array if it doesn't exist
    if (!window.tokenLogs) {
      window.tokenLogs = [];
    }
    
    logDebug('TOKEN_LOGGING', 'Global token logging initialized');
  }
}

/**
 * PhantomConnectOptions interface
 * Used for Phantom wallet connection
 */
export interface PhantomConnectOptions {
  onlyIfTrusted?: boolean;
  _bypassCache?: boolean;
}
