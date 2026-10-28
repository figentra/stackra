/**
 * Stackra file contract:
 * Purpose: `isExpiringSoon`, whether a member's oldest live points expire within thirty days, the rule both
 *          points-balance renderers (web and native) show their warning by.
 * Boundary: a pure function with no clock of its own: the renderer passes the time it read when it mounted, so render
 *           stays pure and a test pins it. Isomorphic, so the react and native entries share it through core.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 2 and 15).
 */

/** Thirty days in milliseconds: the warning window. */
const WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * True when `expiry` falls less than thirty days after `now` (already past included).
 *
 * @param expiry - `BalanceView.nextExpiryAt`; null or undefined when nothing is earned or the data is loading.
 * @param now - epoch milliseconds the caller read once.
 * @example
 * isExpiringSoon(new Date("2026-11-01"), Date.parse("2026-10-21")); // true
 */
export function isExpiringSoon(expiry: Date | null | undefined, now: number): boolean {
  return !!expiry && expiry.getTime() - now < WINDOW_MS;
}
