/**
 * Stackra file contract:
 * Purpose: `TenantRequiredError`, the refusal of work that needs an active tenant when there is none
 *          (`tenant_required`): `useTenant()` without `optional` before a tenant is chosen.
 * Boundary: kind `FailedPrecondition` (HTTP 412), not retryable as sent: choosing a tenant first changes the answer.
 *           It carries no details.
 * Runtime: isomorphic
 * Governing contract: ADR 0210 (decision 3: one tenant context); ADR 0140 (envelope and kinds); final review R-02
 *                     (typed `create`).
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/**
 * Not retryable until a tenant is active.
 *
 * @example
 * throw TenantRequiredError.create();
 */
export class TenantRequiredError extends Refusal({
  kind: ErrorKind.FailedPrecondition,
  retryable: false,
}) {}
