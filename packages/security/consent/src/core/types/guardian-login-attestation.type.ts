/**
 * Stackra file contract:
 * Purpose: `GuardianLoginAttestation`, what the server signs when a guardian has just signed in to their own account
 *          to confirm a consent for someone in their care: who signed in, for whom and which document, when they
 *          authenticated, with which methods and level, and how long the attestation counts.
 * Boundary: a type only, the payload of the token `GuardianLoginAttestationIssuer` signs and
 *           `GuardianLoginConsentVerifierDriver` checks. Every field comes from the guardian's verified session (the
 *           call's assurance) or the server, never from request input. Ids and method codes only: no name, address or
 *           credential. `kind` keeps it apart from a consent snapshot signed by the same key.
 * Runtime: isomorphic
 * Governing contract: ADR 0454 (Consequences: the verification method port); ADR 0207 (decision 1: assurance and
 *                     `auth_time`); ADR 0416 (signer keys); STA-1323; STA-2818.
 */
import type { PublicId } from "@stackra/contracts";

/** One signed guardian sign-in. */
export interface GuardianLoginAttestation {
  /** Always `consent_guardian_login`, so no other token signed by the same key reads as one. */
  readonly kind: "consent_guardian_login";

  /** The attestation's id (`cgl_…`), the verifier's reference kept on the consent proof. */
  readonly id: string;

  /** The guardian who signed in. */
  readonly givenBy: PublicId;

  /** The person they confirm a consent for. */
  readonly subject: PublicId;

  /** The document or purpose key (`photos`, `terms`). */
  readonly document: string;

  /** When the guardian last authenticated (the session's `auth_time`), ISO 8601. */
  readonly authTime: string;

  /** The authentication methods references of that sign-in (`pwd`, `otp`, `hwk`). */
  readonly amr: readonly string[];

  /** The assurance level those methods reach; `null` when none is mapped. */
  readonly level: string | null;

  /** When the attestation was signed, ISO 8601. */
  readonly issuedAt: string;

  /** When it stops counting, ISO 8601. */
  readonly expiresAt: string;
}
