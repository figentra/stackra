/**
 * Stackra file contract:
 * Purpose: `ExternalRoleNotAllowedError`, the refusal of a role an external member may not hold, or of a portal role
 *          given to staff (`external_role_not_allowed`).
 * Boundary: kind `FailedPrecondition` (HTTP 412), not retryable with the same role. The OS membership actions raise it
 *           (STA-1967); `MemoryTenantMembersDriver` raises it in tests, and `MembersPage` shows the host's words for
 *           its code.
 * Runtime: isomorphic
 * Governing contract: ADR 0140 (envelope and kinds); ADR 0208 (memberships); OS ADR 0010 (external members);
 *                     STA-1967.
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/**
 * Pick a role this kind of member may hold.
 *
 * @example
 * throw ExternalRoleNotAllowedError.create();
 */
export class ExternalRoleNotAllowedError extends Refusal({
  kind: ErrorKind.FailedPrecondition,
  retryable: false,
}) {}
