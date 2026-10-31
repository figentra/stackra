/**
 * Stackra file contract:
 * Purpose: `TenantSwitchRefusedError`, the refusal of an isolation that would change the tenant of a transaction that
 *          already runs for another (`tenant_switch_refused`): a nested call or a background unit under a different actor
 *          inside a running transaction.
 * Boundary: kind `FailedPrecondition` (HTTP 412), not retryable as sent: the caller must give the unit a transaction of
 *           its own. It carries no details, never a tenant id.
 * Runtime: isomorphic
 * Governing contract: ADR 0495 (decision 1: fail closed on an actor switch); ADR 0140 (envelope and kinds).
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/**
 * A running transaction keeps its tenant.
 *
 * @example
 * throw TenantSwitchRefusedError.create();
 */
export class TenantSwitchRefusedError extends Refusal({
  kind: ErrorKind.FailedPrecondition,
  retryable: false,
}) {}
