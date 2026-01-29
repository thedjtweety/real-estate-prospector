/**
 * Retry Utility with Exponential Backoff
 * Automatically retries failed API calls to improve reliability
 */

export interface RetryOptions {
  maxRetries?: number; // Default: 2
  initialDelay?: number; // Default: 1000ms
  maxDelay?: number; // Default: 5000ms
  backoffMultiplier?: number; // Default: 2
  retryableErrors?: string[]; // Error messages that should trigger retry
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 2,
  initialDelay: 1000,
  maxDelay: 5000,
  backoffMultiplier: 2,
  retryableErrors: [
    'ECONNREFUSED',
    'ETIMEDOUT',
    'ENOTFOUND',
    'EAI_AGAIN',
    '429', // Rate limit
    '500', // Internal server error
    '502', // Bad gateway
    '503', // Service unavailable
    '504', // Gateway timeout
    'Network request failed',
    'fetch failed',
  ],
};

/**
 * Check if an error should trigger a retry
 */
function isRetryableError(error: any, retryableErrors: string[]): boolean {
  if (!error) return false;
  
  const errorString = error.toString().toLowerCase();
  const errorMessage = error.message?.toLowerCase() || '';
  const errorCode = error.code?.toString() || '';
  const statusCode = error.status?.toString() || error.statusCode?.toString() || '';
  
  return retryableErrors.some(pattern => {
    const lowerPattern = pattern.toLowerCase();
    return (
      errorString.includes(lowerPattern) ||
      errorMessage.includes(lowerPattern) ||
      errorCode.includes(lowerPattern) ||
      statusCode.includes(lowerPattern)
    );
  });
}

/**
 * Sleep for a specified duration
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry a function with exponential backoff
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: any;
  let delay = opts.initialDelay;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      // Execute the function
      const result = await fn();
      
      // Log success if this was a retry
      if (attempt > 0) {
        console.log(`[Retry] Success on attempt ${attempt + 1}/${opts.maxRetries + 1}`);
      }
      
      return result;
    } catch (error: any) {
      lastError = error;
      
      // Check if we should retry
      const shouldRetry = isRetryableError(error, opts.retryableErrors);
      const isLastAttempt = attempt === opts.maxRetries;
      
      if (!shouldRetry || isLastAttempt) {
        // Don't retry or no more attempts left
        if (attempt > 0) {
          console.error(`[Retry] Failed after ${attempt + 1} attempts:`, error.message);
        }
        throw error;
      }
      
      // Log retry attempt
      console.warn(`[Retry] Attempt ${attempt + 1}/${opts.maxRetries + 1} failed: ${error.message}`);
      console.warn(`[Retry] Retrying in ${delay}ms...`);
      
      // Wait before retrying
      await sleep(delay);
      
      // Increase delay for next retry (exponential backoff)
      delay = Math.min(delay * opts.backoffMultiplier, opts.maxDelay);
    }
  }

  // This should never be reached, but TypeScript needs it
  throw lastError;
}

/**
 * Wrap an async function to automatically retry on failure
 */
export function createRetryableFunction<TArgs extends any[], TReturn>(
  fn: (...args: TArgs) => Promise<TReturn>,
  options: RetryOptions = {}
): (...args: TArgs) => Promise<TReturn> {
  return async (...args: TArgs): Promise<TReturn> => {
    return withRetry(() => fn(...args), options);
  };
}
