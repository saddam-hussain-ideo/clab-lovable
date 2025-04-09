import { logDebug } from "@/utils/debugLogging";

/**
 * Interface for retry options
 */
export interface RetryOptions {
  maxAttempts?: number;
  maxRetries?: number;  // Alias for maxAttempts
  delayMs?: number;
  onRetry?: (error: Error, attempt: number) => void;
  shouldRetry?: (error: Error) => boolean;
  context?: string;
}

/**
 * Retry a function with backoff
 * @param fn Function to retry
 * @param options Retry options
 * @returns Promise with the function result
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions
): Promise<T> {
  const maxAttempts = options.maxRetries || options.maxAttempts || 3;
  const delayMs = options.delayMs || 1000;
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      
      // Log the retry attempt
      const context = options.context ? `[${options.context}] ` : '';
      logDebug('RETRY', `${context}Attempt ${attempt} failed: ${error.message}`);
      
      // Check if we should retry
      if (options.shouldRetry && !options.shouldRetry(error)) {
        throw error;
      }
      
      // Call the onRetry callback if provided
      if (options.onRetry) {
        options.onRetry(error, attempt);
      }
      
      // If this is not the last attempt, wait before retrying
      if (attempt < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }
  
  // If we get here, all retries failed
  throw lastError || new Error('Operation failed after all retry attempts');
}

/**
 * Create a retry-enabled version of a function
 * @param fn Function to make retryable
 * @param options Retry options
 * @returns Retryable function
 */
export function createRetryableFunction<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: RetryOptions
): T {
  return ((...args: any[]) => withRetry(
    () => fn(...args),
    options
  )) as T;
}

// Alias for withRetry to maintain compatibility with existing code
export const withRpcRetry = withRetry;
