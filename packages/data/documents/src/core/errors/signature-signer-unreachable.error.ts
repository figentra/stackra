/**
 * Stackra file contract:
 * Purpose: `SignatureSignerUnreachableError` (`signature_signer_unreachable`), a signer has no contact the chosen
 *          e-signature provider can reach (Documenso needs an email).
 * Boundary: a validation refusal (400), never retryable. It names the signer's `order` only, never a name or a
 *           contact. Thrown by `ESignatureProvider` Connections before anything is sent.
 * Runtime: isomorphic
 * Governing contract: ADR 0365 (decision 5); ADR 0140 (envelope and kinds).
 */
import { ErrorKind, Refusal } from "@stackra/errors";

/** A signer cannot be reached by the provider. */
export class SignatureSignerUnreachableError extends Refusal({
  kind: ErrorKind.Validation,
  retryable: false,
}) {
  /** The signing order of the first unreachable signer. */
  order!: number;
}
