/**
 * Stackra file contract:
 * Purpose: `TenantScopeUnresolvedError`, the refusal of a job or system call whose scope the scope tree does not
 *          show, or shows at another path than the reference carries (`tenant_scope_unresolved`): it would otherwise
 *          run with no tenant and read zero rows as if that were the answer.
 * Boundary: raised by `CallIsolationDriver`; kind `FailedPrecondition` (HTTP 412), not retryable as stored: the work
 *           names a scope that does not exist (or no longer does). It carries no details.
 * Runtime: isomorphic
 * Governing contract: ADR 0495 (decision 2 and the note of 2026-11-01); ADR 0098 (a job's scope is platform-written);
 *                     ADR 0140 (envelope and kinds).
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/**
 * The scope has no tenant answer.
 *
 * @example
 * throw TenantScopeUnresolvedError.create();
 */
export class TenantScopeUnresolvedError extends Refusal({
  kind: ErrorKind.FailedPrecondition,
  retryable: false,
}) {}
