/**
 * Stackra file contract:
 * Purpose: `waitForHttp(url, timeoutMs, options?)`, whether a dev server answers: true once any HTTP answer comes
 *          back from `url` (a 404 counts: the gateway is up), false when none came within `timeoutMs` or once
 *          `options.signal` aborts (the run ended first).
 * Boundary: GET requests only, each bounded by the time left; reads no body.
 * Runtime: node
 * Governing contract: STA-2664 (item 5: migrate and seed once the app is up); STA-2840.
 */

/**
 * Polls `url` until it answers.
 *
 * @example
 * if (await waitForHttp("http://localhost:4000/", 300_000)) await seed();
 */
export async function waitForHttp(
  url: string,
  timeoutMs: number,
  options: { readonly everyMs?: number; readonly signal?: AbortSignal } = {},
): Promise<boolean> {
  const { everyMs = 500, signal } = options;
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (signal?.aborted === true) return false;
    try {
      const answer = await fetch(url, {
        signal: AbortSignal.timeout(Math.max(1, Math.min(5000, deadline - Date.now()))),
      });
      await answer.body?.cancel();
      return true;
    } catch {
      await new Promise((resolve) => {
        setTimeout(resolve, everyMs);
      });
    }
  }
  return false;
}
