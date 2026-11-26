/**
 * Stackra file contract:
 * Purpose: `ContentCredentialTrust`, how far a content credential read back from an image is to be believed:
 *          `trusted`, `unverified` or `invalid`.
 * Boundary: an `Enum.of` value plus the type of the same name. Only `trusted` may be shown as genuine or counted as
 *           proof of origin; an `unverified` credential's claims are shown as claims only, and an `invalid` one's not
 *           at all. Which anchors count is the driver's (the `c2pa` driver: the pinned C2PA trust list and our own
 *           signing certificates).
 * Runtime: isomorphic
 * Governing contract: STA-2791 (CTO decision of 2026-11-25: three states, fail closed); COM-73, COM-294; ADR 0245.
 */
import { Enum } from "@stackra/contracts";

/** A read credential's trust. */
export const ContentCredentialTrust = Enum.of({
  /** The manifest verifies and its signer chains to an allowed trust anchor: the only state shown as genuine. */
  Trusted: "trusted",
  /**
   * The manifest verifies but its signer chains to no allowed anchor (an unknown or self-made CA), or no anchor
   * could be used: the claims are shown, never labelled genuine and never counted as proof.
   */
  Unverified: "unverified",
  /** The manifest does not verify (the image changed after signing, or a bad signature): no claim is read. */
  Invalid: "invalid",
});

/** One of the trust states above. */
export type ContentCredentialTrust = Enum.Value<typeof ContentCredentialTrust>;
