/**
 * Stackra file contract:
 * Purpose: `SandboxNotFoundError`, the refusal of an operation on a sandbox that does not exist or does not belong to
 *          the live tenant named (`sandbox_not_found`).
 * Boundary: kind `NotFound`, not retryable, no details: it never tells one tenant about another's sandboxes.
 * Runtime: isomorphic
 * Governing contract: ADR 0140 (envelope and kinds); ADR 0280.
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/**
 * No such sandbox here.
 *
 * @example
 * throw SandboxNotFoundError.create();
 */
export class SandboxNotFoundError extends Refusal({
  kind: ErrorKind.NotFound,
  retryable: false,
}) {}
