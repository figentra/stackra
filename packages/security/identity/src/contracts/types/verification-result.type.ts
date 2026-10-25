/**
 * Stackra file contract:
 * Purpose: `VerificationResult`, a provider's answer to one check: the status, the driver that answered, the
 *          provider's own reference, when it answered and the reason codes.
 * Boundary: a type only. Reason codes are the provider's, mapped by the driver to stable snake_case codes; no document
 *           image or raw payload travels here.
 * Runtime: isomorphic
 * Governing contract: Stackra 0357 (decision 7); OS-54.
 */
import type { VerificationStatus } from "#contracts/enums/verification-status.enum";

/** One answer. */
export interface VerificationResult {
  /** Where the check stands. */
  readonly status: VerificationStatus;

  /** The driver key that answered (`wathq`, `uqudo`); set by the service. */
  readonly provider: string;

  /** The provider's id for the check, for a later lookup or webhook. */
  readonly providerReference?: string;

  /** When the provider answered. */
  readonly checkedAt: Date;

  /** Why, as stable reason codes (`document_expired`, `name_mismatch`); empty when verified. */
  readonly reasons: readonly string[];
}
