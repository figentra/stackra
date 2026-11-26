/**
 * Stackra file contract:
 * Purpose: `IssuedGuardianLoginAttestation`, what `GuardianLoginAttestationIssuer.issue` answers: the compact signed
 *          token the guardian's flow passes as the verification evidence, and the attestation it carries.
 * Boundary: a type only. The token is opaque to the client; only `GuardianLoginConsentVerifierDriver` reads it.
 * Runtime: isomorphic
 * Governing contract: ADR 0454 (Consequences); STA-2818.
 */
import type { GuardianLoginAttestation } from "#core/types/guardian-login-attestation.type";

/** A freshly signed guardian sign-in. */
export interface IssuedGuardianLoginAttestation {
  /** The compact token: base64url payload, base64url key id and base64url signature, joined by dots. */
  readonly token: string;

  /** The attestation the token carries. */
  readonly attestation: GuardianLoginAttestation;
}
