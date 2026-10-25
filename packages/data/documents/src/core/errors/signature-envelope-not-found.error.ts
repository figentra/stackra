/**
 * Stackra file contract:
 * Purpose: `SignatureEnvelopeNotFoundError` (`signature_envelope_not_found`), an e-signature provider has no envelope
 *          with this id.
 * Boundary: a not-found refusal (404), never retryable. Thrown by `ESignatureProvider` drivers.
 * Runtime: isomorphic
 * Governing contract: ADR 0365 (decision 5); ADR 0140 (envelope and kinds).
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/** No such envelope. */
export class SignatureEnvelopeNotFoundError extends Refusal({
  kind: ErrorKind.NotFound,
  retryable: false,
}) {
  /** The id asked for. */
  envelopeId!: string;
}
