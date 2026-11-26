/**
 * Stackra file contract:
 * Purpose: `IDEMPOTENCY_LEASE`, how long a claimed Idempotency-Key stays held while its first call runs: 15 minutes,
 *          separate from the 24-hour replay window a completed key keeps (`IDEMPOTENCY_TTL`).
 * Boundary: a constant passed to `IdempotencyStore.claim`, never longer than the call's replay window. A call that
 *           never finished (its process died) frees its key when the lease ends, so the retry runs instead of meeting
 *           `idempotency_key_in_progress` for a day. With a store that joins the call's transaction the held record
 *           never commits on its own, so the lease only matters for the Valkey and memory stores and for a call with
 *           no transaction around it.
 * Runtime: isomorphic
 * Governing contract: ADR 0136 (decision 3); ADR 0495 (note of 2026-11-26); STA-2797.
 */
import { Duration } from "@stackra/contracts";

/** How long a running call holds its Idempotency-Key: fifteen minutes. */
export const IDEMPOTENCY_LEASE = Duration.minutes(15);
