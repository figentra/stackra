/**
 * Stackra file contract:
 * Purpose: `TenantMembershipMissingError`, the refusal of a switch to a tenant the signed-in user has no membership in
 *          (`tenant_membership_missing`).
 * Boundary: raised by `TenantSwitcher.switchTo`; kind `Forbidden` (HTTP 403), not retryable. It carries no details, so
 *           it never echoes the tenant id it was asked for. The server never trusts the switch anyway: it drops a
 *           scope header outside the caller's grants.
 * Runtime: isomorphic
 * Governing contract: ADR 0208 (memberships); ADR 0140 (envelope and kinds); final review R-02 (typed `create`).
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/**
 * Not retryable: only a new membership changes the answer.
 *
 * @example
 * throw TenantMembershipMissingError.create();
 */
export class TenantMembershipMissingError extends Refusal({
  kind: ErrorKind.Forbidden,
  retryable: false,
}) {}
