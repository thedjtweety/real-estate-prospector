/**
 * Wraps a promise with a timeout
 * If the promise doesn't resolve within the timeout, it rejects with a timeout error
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  operationName: string = 'Operation'
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(
        () => reject(new Error(`${operationName} timed out after ${timeoutMs}ms`)),
        timeoutMs
      )
    ),
  ]);
}

/**
 * Wraps an async function with a timeout
 */
export async function withTimeoutFn<T>(
  fn: () => Promise<T>,
  timeoutMs: number,
  operationName: string = 'Operation'
): Promise<T> {
  return withTimeout(fn(), timeoutMs, operationName);
}
