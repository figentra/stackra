/**
 * Stackra file contract:
 * Purpose: `SignatureEnvelope`, the provider's record of one request: its id, the caller's reference and where it is.
 * Boundary: a type only; the status is normalised (`SignatureStatus`), never the provider's own word.
 * Runtime: isomorphic
 * Governing contract: ADR 0365 (decision 5).
 */
import type { SignatureStatus } from "#contracts/enums/signature-status.enum";

/** An envelope at a provider. */
export interface SignatureEnvelope {
  /** The provider's id of the envelope. */
  readonly id: string;

  /** The caller's `SignatureRequest.reference`. */
  readonly reference: string;

  /** Where the envelope is. */
  readonly status: SignatureStatus;

  /** When it reached a final status (ISO 8601); absent while it is open. */
  readonly closedAt?: string;
}
