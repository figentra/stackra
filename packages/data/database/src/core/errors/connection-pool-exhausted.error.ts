/**
 * Stackra file contract:
 * Purpose: `ConnectionPoolExhaustedError`, the refusal of a call that waited longer than the pool's `acquireTimeout`
 *          for a database connection: every place the connection gate keeps for its depth stayed taken, or the `pg`
 *          pool had none to hand.
 * Boundary: a refusal (`unavailable`, 503) that is retryable: the same call may succeed once the load drops. Carries
 *           no details. Raised by the connection gate and by `translateDbError` for the `pg` pool's own timeout.
 * Runtime: node
 * Governing contract: ADR 0140 (refusals); ADR 0328 (built with `create`); ADR 0473 (2026-11-26 note); STA-1716.
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/** No connection came free in time; retry the call. */
export class ConnectionPoolExhaustedError extends Refusal({
  kind: ErrorKind.Unavailable,
  retryable: true,
}) {}
