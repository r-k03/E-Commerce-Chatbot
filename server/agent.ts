import "dotenv/config";

async function retryWithExponentialBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3
): Promise<T> {
  for (let i = 1; i <= maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (!(error instanceof Error)) {
        throw new Error(`Agent Failed: ${String(error)}`);
      }

      if (!("status" in error)) {
        throw new Error(`Agent Failed: ${error.message}`);
      }

      if (error.status === 429 && i < maxRetries) {
        const backoff = Math.min(1000 * Math.pow(2, i), 30000);
        console.error(`Rate Limit Reached. Retrying in ${backoff} seconds.`);
        await new Promise((resolve) => setTimeout(resolve, backoff));
        continue;
      }
      throw error;
    }
  }
  throw new Error("Exceeded Max Retries Allowed");
}