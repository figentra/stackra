/**
 * Stackra file contract:
 * Purpose: `ConsentProofWriteFailedError`, the refusal a durable `ConsentProofStore` driver throws when it cannot
 *          append a proof because its subject's chain head kept moving under concurrent writers.
 * Boundary: kind `Unavailable` (HTTP 503), retryable: the answer is still in hand, so the caller may try again; code
 *           `consent_proof_write_failed`. No details, so no proof content or personal data travels with it. A failure
 *           of the database itself is not wrapped: it propagates as the database's own error.
 * Runtime: isomorphic
 * Governing contract: ADR 0140 (envelope and kinds); ADR 0328 (built with `create`); ADR 0212 (decision 3); STA-2818.
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/**
 * Retryable: the proof was not stored, and a later append may succeed.
 *
 * @example
 * throw ConsentProofWriteFailedError.create({}, { cause });
 */
export class ConsentProofWriteFailedError extends Refusal({
  kind: ErrorKind.Unavailable,
  retryable: true,
}) {}
