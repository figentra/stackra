/**
 * Stackra file contract:
 * Purpose: `DecodedGuardianLoginAttestation`, an attestation token split into what the verifier checks: the payload,
 *          the exact bytes that were signed, and the detached signature.
 * Boundary: internal type; what `decodeGuardianLoginAttestation` returns and `GuardianLoginConsentVerifierDriver`
 *           reads. Nothing in it is trusted until the signature verifies with a trusted key.
 * Runtime: isomorphic
 * Governing contract: ADR 0454 (Consequences); ADR 0416; STA-2818.
 */
import type { Signature } from "@stackra/contracts";

import type { GuardianLoginAttestation } from "#core/types/guardian-login-attestation.type";

/** A decoded, not yet verified, attestation token. */
export interface DecodedGuardianLoginAttestation {
  /** The payload, shape-checked only. */
  readonly attestation: GuardianLoginAttestation;

  /** The bytes the signature covers: the token's first segment as sent. */
  readonly message: Uint8Array;

  /** The detached ES256 signature and the key id it names. */
  readonly signature: Signature;
}
