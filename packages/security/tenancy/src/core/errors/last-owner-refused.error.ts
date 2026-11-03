/**
 * Stackra file contract:
 * Purpose: `LastOwnerRefusedError`, the refusal of a role change or a removal that would leave the active tenant
 *          without an owner (`last_owner_refused`).
 * Boundary: kind `FailedPrecondition` (HTTP 412), not retryable: another owner must be named first. The OS membership
 *           actions raise it (STA-1967); `MemoryTenantMembersDriver` raises it in tests, and `MembersPage` shows the
 *           host's words for its code.
 * Runtime: isomorphic
 * Governing contract: ADR 0140 (envelope and kinds); ADR 0208 (memberships); STA-1967.
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/**
 * Name another owner first.
 *
 * @example
 * throw LastOwnerRefusedError.create();
 */
export class LastOwnerRefusedError extends Refusal({
  kind: ErrorKind.FailedPrecondition,
  retryable: false,
}) {}
