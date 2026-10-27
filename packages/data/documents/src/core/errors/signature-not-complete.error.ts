/**
 * Stackra file contract:
 * Purpose: `SignatureNotCompleteError` (`signature_not_complete`), the signed PDF of an envelope that is not `signed`
 *          was asked for.
 * Boundary: a precondition refusal (412), never retryable by itself: the caller waits for the `signed` status first.
 * Runtime: isomorphic
 * Governing contract: ADR 0365 (decision 5); ADR 0140 (envelope and kinds).
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/** The envelope has not been signed. */
export class SignatureNotCompleteError extends Refusal({
  kind: ErrorKind.FailedPrecondition,
  retryable: false,
}) {
  /** The id of the envelope still waiting on signatures. */
  envelopeId!: string;

  /** Its status now. */
  status!: string;
}
