/**
 * Stackra file contract:
 * Purpose: `POOL_GATE_DEFAULTS`, what the connection gate uses for a pool option left out: the `pg` pool's own ten
 *          connections, chains up to four connections deep (a relay tick, the delivery it isolates, the inbox receipt
 *          that runs a listener's call, and the `requiresNew` store that call opens), and a thirty-second wait for a
 *          place before the transaction is refused as retryable.
 * Boundary: internal to `PostgresDatabaseDriver.connect`.
 * Runtime: isomorphic
 * Governing contract: ADR 0473 (decision 2 and the 2026-11-26 note: the gate); ADR 0495 (decisions 2 and 6); STA-1716.
 */
import { Duration } from "@stackra/contracts";

/** The pool size, nesting and wait the gate uses when the pool does not say. */
export const POOL_GATE_DEFAULTS = {
  max: 10,
  nesting: 4,
  acquireTimeout: Duration.seconds(30),
} as const;
