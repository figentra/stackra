/**
 * Stackra file contract:
 * Purpose: `retryDelay(attempt, random)`, the back-off `runTransaction` waits before it runs a failed transaction's
 *          work again: full jitter under a ceiling that doubles from `TRANSACTION_RETRY.baseMs` up to `capMs`.
 * Boundary: internal to `runTransaction`; pure, so a test passes its own `random`.
 * Runtime: isomorphic
 * Governing contract: data-layer gap mo6 (P1 part, stackra-279).
 */
import { TRANSACTION_RETRY } from "#core/constants/transaction-retry.constant";

/**
 * The back-off in milliseconds before retry `attempt` (0 for the first).
 *
 * @param random - a number in [0, 1); `Math.random` outside tests.
 * @example
 * await sleep(retryDelay(attempt));
 */
export function retryDelay(attempt: number, random: number = Math.random()): number {
  const ceiling = Math.min(TRANSACTION_RETRY.capMs, TRANSACTION_RETRY.baseMs * 2 ** attempt);
  return Math.floor(random * ceiling);
}
