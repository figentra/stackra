/**
 * Stackra file contract:
 * Purpose: `ScopeNotPlatformWrittenError`, the refusal of a push whose `scope` is not a platform `ScopeRef`
 *          (`scope_not_platform_written`): not an object with an `scp_` id and an `ltree` path, so it can only have
 *          come from somewhere other than the platform's scope types.
 * Boundary: raised by `QueueService` before anything is stored. Kind `Forbidden` (HTTP 403), not retryable: the caller
 *           passed input where the platform's own scope belongs (ADR 0098). It carries no details, never the value.
 *           It checks the shape only: a `ScopeRef` is a plain structural type with no marker, so a well-shaped
 *           reference of a node that does not exist is caught when the job runs, where `CallIsolation` resolves the
 *           scope in the scope tree and refuses an unknown one (`tenant_scope_unresolved`).
 * Runtime: isomorphic
 * Governing contract: ADR 0098 (a job's scope is platform-written); ADR 0327 (decision 7: a scope never comes from
 *                     request input); ADR 0495 (note of 2026-11-01); ADR 0140 (envelope and kinds).
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/**
 * The scope is not one the platform wrote.
 *
 * @example
 * throw ScopeNotPlatformWrittenError.create();
 */
export class ScopeNotPlatformWrittenError extends Refusal({
  kind: ErrorKind.Forbidden,
  retryable: false,
}) {}
