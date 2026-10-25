/**
 * Stackra file contract:
 * Purpose: `JOURNAL_LOCK_TTL`, how long a journal write waits for an account another write holds before `Locks`
 *          refuses `lock_unavailable` (503, retryable).
 * Boundary: internal; read by `Journal` only. On Postgres the account lock is a transaction-level advisory lock, so it
 *           lasts until the caller's transaction ends whatever the TTL; the TTL bounds only the wait.
 * Runtime: node
 * Governing contract: ADR 0149 (decisions 1 and 2).
 */
import { Duration } from "@stackra/contracts";

/** Five seconds: far above one account write, short enough to fail a stuck request. */
export const JOURNAL_LOCK_TTL: Duration = Duration.seconds(5);
