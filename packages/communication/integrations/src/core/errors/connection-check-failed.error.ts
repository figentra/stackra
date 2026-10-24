/**
 * Stackra file contract:
 * Purpose: `ConnectionCheckFailedError` (`connection_check_failed`), the refusal a connection's `check()` throws when
 *          the credentials work but the account cannot serve (an unverified sender domain, a missing permission).
 * Boundary: kind `FailedPrecondition`, never retryable. Its one detail is the reason, a snake_case code the console
 *           translates, never provider text. At connect nothing is stored when it is thrown; on the health schedule
 *           it counts as a failed check.
 * Runtime: isomorphic
 * Governing contract: ADR 0308 (rule 14); ADR 0140 (envelope and kinds); ADR 0231 (snake_case codes).
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/** The connection's account cannot serve; `reason` says why. */
export class ConnectionCheckFailedError extends Refusal({
  kind: ErrorKind.FailedPrecondition,
  retryable: false,
}) {
  /** Why, as a snake_case code (`sender_domain_unverified`). */
  reason!: string;
}
