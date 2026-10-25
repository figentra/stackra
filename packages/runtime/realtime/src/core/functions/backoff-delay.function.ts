/**
 * Stackra file contract:
 * Purpose: `backoffDelay(attempt, maxSeconds)`, how long the client waits before reconnect attempt `attempt` (from 0):
 *          exponential from one second, capped at `maxSeconds`, with jitter so a server restart is not met by every
 *          client at once.
 * Boundary: a pure function; `random` is injectable so a test pins the jitter. The delay lies in the upper half of
 *           the cap (equal jitter), so it never collapses to zero.
 * Runtime: isomorphic
 * Governing contract: ADR 0225 (decision 1: reconnect).
 */

/** The first attempt's cap, in milliseconds. */
const BASE_MS = 1000;

/**
 * The wait in milliseconds before attempt `attempt`.
 *
 * @param random - a number in [0, 1); `Math.random` by default.
 * @example
 * backoffDelay(0, 30); // 500 to 1000
 * backoffDelay(10, 30); // 15000 to 30000
 */
export function backoffDelay(
  attempt: number,
  maxSeconds: number,
  random: () => number = Math.random,
): number {
  const cap = Math.min(maxSeconds * 1000, BASE_MS * 2 ** Math.min(attempt, 30));
  return cap / 2 + random() * (cap / 2);
}
