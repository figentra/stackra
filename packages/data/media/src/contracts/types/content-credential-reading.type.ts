/**
 * Stackra file contract:
 * Purpose: `ContentCredentialReading`, what `ContentCredentials.read` finds in an image that carries a manifest: the
 *          credential with how far its signer is trusted, or `invalid` with no credential.
 * Boundary: a type only. A `trusted` reading may be shown as genuine; an `unverified` one's credential is the
 *           signer's claim, never proof; an `invalid` one carries no claim. An image with no manifest is `null` at the
 *           port, not a reading.
 * Runtime: isomorphic
 * Governing contract: STA-2791 (CTO decision of 2026-11-25); COM-73, COM-294; ADR 0245.
 */
import type { ContentCredentialTrust } from "#contracts/enums/content-credential-trust.enum";
import type { ContentCredential } from "#contracts/types/content-credential.type";

/** A manifest that verifies: its credential and whether its signer is trusted. */
interface VerifiedContentCredentialReading {
  /** `trusted` (an allowed anchor vouches for the signer) or `unverified` (none does). */
  readonly trust: typeof ContentCredentialTrust.Trusted | typeof ContentCredentialTrust.Unverified;

  /** The claim the manifest states. */
  readonly credential: ContentCredential;
}

/** A manifest that does not verify: nothing it states is read. */
interface InvalidContentCredentialReading {
  /** Always `invalid`. */
  readonly trust: typeof ContentCredentialTrust.Invalid;
}

/** One reading of an image's content credential. */
export type ContentCredentialReading =
  | VerifiedContentCredentialReading
  | InvalidContentCredentialReading;
