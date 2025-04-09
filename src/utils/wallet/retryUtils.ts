
import { logDebug } from "@/utils/debugLogging";

/**
 * Retry a function with exponential backoff
 */
export const withRetryBackoff = async <T>(
  fn: () => Promise<T>, 
  maxRetries = 3,
  context = 'RetryOperation'
): Promise<T> => {
  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      logDebug('RETRY', `${context} - Attempt ${attempt + 1}/${maxRetries + 1} failed: ${error?.message}`);
      lastError = error;
      
      const shouldRetry = 
        error.message?.includes('429') || 
        error.message?.includes('rate limit') ||
        error.message?.includes('timeout') || 
        error.message?.includes('network') ||
        error.message?.includes('public key') || // Added for Solflare issues
        error.message?.includes('not ready') ||  // Added for wallet not ready errors
        error.message?.includes('connected but'); // Added for "connected but no public key" errors
      
      if (!shouldRetry || attempt === maxRetries) {
        throw error;
      }
      
      // More aggressive initial backoffs, especially for wallet operations
      const initialDelay = context.includes('Wallet') || context.includes('Solflare') ? 3000 : 1000;
      const delay = Math.min(initialDelay * Math.pow(2, attempt), 15000); // Increased max timeout
      const jitter = Math.random() * 1000;
      
      logDebug('RETRY', `${context} - Waiting ${Math.round((delay + jitter) / 1000)}s before retry ${attempt + 1}`);
      await new Promise(r => setTimeout(r, delay + jitter));
    }
  }
  
  throw lastError;
};

/**
 * Enhanced retry function specifically for wallet operations with more control
 */
export const withWalletRetry = async <T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    onRetry?: (error: any, attempt: number) => void;
    shouldRetry?: (error: any) => boolean;
    retryDelay?: number;
    maxRetryDelay?: number;
    context?: string;
  } = {}
): Promise<T> => {
  const {
    maxRetries = 3,
    onRetry = () => {},
    shouldRetry = () => true,
    retryDelay = 2000,
    maxRetryDelay = 15000,
    context = 'WalletOperation'
  } = options;
  
  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      logDebug('RETRY', `${context} - Attempt ${attempt + 1}/${maxRetries + 1} failed: ${error?.message}`);
      lastError = error;
      
      // Call the onRetry callback
      onRetry(error, attempt + 1);
      
      if (!shouldRetry(error) || attempt === maxRetries) {
        throw error;
      }
      
      const delay = Math.min(retryDelay * Math.pow(1.5, attempt), maxRetryDelay);
      const jitter = Math.random() * 1000;
      
      logDebug('RETRY', `${context} - Waiting ${Math.round((delay + jitter) / 1000)}s before retry ${attempt + 1}`);
      await new Promise(r => setTimeout(r, delay + jitter));
    }
  }
  
  throw lastError;
};

// Direct export of withRetryBackoff for backward compatibility
export const withRetry = withWalletRetry;
