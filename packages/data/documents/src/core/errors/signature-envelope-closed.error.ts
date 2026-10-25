/**
 * Stackra file contract:
 * Purpose: `SignatureEnvelopeClosedError` (`signature_envelope_closed`), a change asked of an envelope that is already
 *          in a final status (signed, declined, expired or cancelled).
 * Boundary: a conflict refusal (409), never retryable: a final status never moves.
 * Runtime: isomorphic
 * Governing contract: ADR 0365 (decision 5); ADR 0140 (envelope and kinds).
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/** The envelope is closed. */
export class SignatureEnvelopeClosedError extends Refusal({
  kind: ErrorKind.Conflict,
  retryable: false,
}) {
  /** The envelope. */
  envelopeId!: string;

  /** Its final status. */
  status!: string;
}
