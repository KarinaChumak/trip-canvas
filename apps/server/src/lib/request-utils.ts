export type Settled<T> = {
  /** Answers of the requests that succeeded, in request order. */
  results: T[];
  /** Labels of the requests that failed, e.g. "CNX → DMK", for the model to mention. */
  failed: string[];
};

/**
 * Runs every request in parallel and keeps what came back, so one failing airport pair
 * doesn't sink the others. Throws the first error only when every request failed.
 */
export async function settleRequests<R, T>(requests: R[], run: (request: R) => Promise<T>, label: (request: R) => string): Promise<Settled<T>> {
  const outcomes = await Promise.allSettled(requests.map(run));
  const results: T[] = [];
  const failed: string[] = [];
  const errors: unknown[] = [];
  outcomes.forEach((outcome, i) => {
    if (outcome.status === 'fulfilled') {
      results.push(outcome.value);
    } else {
      failed.push(label(requests[i]!));
      errors.push(outcome.reason);
    }
  });
  if (requests.length > 0 && results.length === 0) throw errors[0];
  return { results, failed };
}
