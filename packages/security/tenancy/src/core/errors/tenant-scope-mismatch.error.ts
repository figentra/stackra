/**
 * Stackra file contract:
 * Purpose: `TenantScopeMismatchError`, the refusal of a call whose actor acts in one tenant and whose scope belongs to
 *          another, or whose several granted scopes span tenants (`tenant_scope_mismatch`): neither tenant is picked.
 * Boundary: raised by `CallIsolationDriver` before the isolation transaction opens, for an actor that is not a job or
 *           system actor (those take the tenant of their platform-written scope). Kind `Forbidden` (HTTP 403), not
 *           retryable. It carries no details, never a tenant id.
 * Runtime: isomorphic
 * Governing contract: ADR 0495 (decision 2 and the note of 2026-11-01: a user stays bound to its own tenant); ADR 0140
 *                     (envelope and kinds).
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/**
 * The actor's tenant and the scope's tenant disagree.
 *
 * @example
 * throw TenantScopeMismatchError.create();
 */
export class TenantScopeMismatchError extends Refusal({
  kind: ErrorKind.Forbidden,
  retryable: false,
}) {}
