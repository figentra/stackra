/**
 * Stackra file contract:
 * Purpose: `PAYMENT_LOCK_TTL`, how long a call on a payment waits for another call on the same payment before `Locks`
 *          refuses `lock_unavailable` (503, retryable).
 * Boundary: internal; read by `PaymentService` only. A driver that leases keeps renewing the lease while the work runs,
 *           and on Postgres the lock is a transaction-level advisory lock that lasts until the caller's transaction ends,
 *           so the TTL bounds only the wait, not the provider call it protects.
 * Runtime: isomorphic
 * Governing contract: ADR 0149 (decisions 1 and 2); ADR 0357 (decision 5); ADR 0220 (decision 4).
 */
import { Duration } from "@stackra/contracts";

/** Ten seconds: longer than one provider call, short enough to fail a stuck request. */
export const PAYMENT_LOCK_TTL: Duration = Duration.seconds(10);
