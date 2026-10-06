// Pace every gateway HTTP request (including initialization and tools/list),
// not just tool calls: sequential calls can still burst through a minute window.
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function retryAfterMs(value, now) {
  if (!value) return null;
  const seconds = Number(value);
  if (Number.isFinite(seconds) && seconds >= 0) return seconds * 1000;
  const date = Date.parse(value);
  return Number.isFinite(date) ? Math.max(0, date - now) : null;
}

export function createGatewayFetch({
  fetchImpl = globalThis.fetch,
  sleep = delay,
  now = Date.now,
  intervalMs = 1500,
  retryBudget = 3,
  maxRetryDelayMs = 120_000,
  warn = console.warn,
} = {}) {
  let nextRequestAt = 0;
  let queue = Promise.resolve();
  // The budget is shared across the entire inspection, so a gateway outage
  // cannot multiply long retries by the number of contracted tools.
  let retriesLeft = retryBudget;

  async function request(input, init) {
    let attempt = 0;
    while (true) {
      init?.signal?.throwIfAborted();
      const wait = Math.max(0, nextRequestAt - now());
      if (wait > 0) await sleep(wait);
      init?.signal?.throwIfAborted();
      nextRequestAt = now() + intervalMs;
      const response = await fetchImpl(input, init);
      // Policy failures are HTTP 200 MCP tool errors and must remain failures.
      // Authentication and other HTTP errors are not rate-limit retries either.
      if (response.status !== 429 || retriesLeft === 0) return response;
      const retryDelay = retryAfterMs(response.headers.get('retry-after'), now())
        ?? Math.min(65_000 * 2 ** attempt, maxRetryDelayMs);
      // Do not retry before an hourly quota resets or outlive the workflow.
      if (retryDelay > maxRetryDelayMs) return response;
      retriesLeft -= 1;
      attempt += 1;
      await response.body?.cancel();
      nextRequestAt = Math.max(nextRequestAt, now() + retryDelay);
      warn(`Gateway rate limit: retrying after ${Math.ceil(retryDelay / 1000)}s (${retriesLeft} retries left).`);
    }
  }

  return (input, init) => {
    const result = queue.then(() => request(input, init));
    queue = result.then(() => undefined, () => undefined);
    return result;
  };
}
