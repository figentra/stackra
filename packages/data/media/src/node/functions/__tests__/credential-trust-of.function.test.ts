/**
 * Stackra file contract:
 * Purpose: unit tests of `credentialTrustOf`: `trusted` only for a `Trusted` store whose active manifest carries
 *          `signingCredential.trusted` and no failure; `invalid` for an `Invalid` store or failures without a state;
 *          `unverified` for everything else, including the recorded `Valid` store and a store with no state.
 * Boundary: test only; pure, over the recorded fixture.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; COM-73, COM-294; STA-2791 (CTO decision of 2026-11-25).
 */
import { describe, expect, it } from "@stackra/testing";

import { ContentCredentialTrust } from "#contracts/enums/content-credential-trust.enum";
import { C2PA_AI_IMAGE_STORE } from "#node/functions/__tests__/c2pa-store.fixture";
import { credentialTrustOf } from "#node/functions/credential-trust-of.function";

/** The codes c2pa-rs gives a manifest whose signer it trusts (recorded from c2pa-node 0.9.10). */
const TRUSTED_RESULTS = {
  activeManifest: {
    success: [
      { code: "signingCredential.trusted" },
      { code: "claimSignature.insideValidity" },
      { code: "claimSignature.validated" },
      { code: "assertion.dataHash.match" },
    ],
    failure: [],
  },
};

describe("credentialTrustOf", () => {
  it("trusts a Trusted store whose signer the engine vouched for", () => {
    expect(
      credentialTrustOf({
        ...C2PA_AI_IMAGE_STORE,
        validation_state: "Trusted",
        validation_results: TRUSTED_RESULTS,
      }),
    ).toBe(ContentCredentialTrust.Trusted);
  });

  it("does not trust a Valid store: its signer chains to no allowed anchor", () => {
    expect(credentialTrustOf(C2PA_AI_IMAGE_STORE)).toBe(ContentCredentialTrust.Unverified);
    expect(
      credentialTrustOf({
        ...C2PA_AI_IMAGE_STORE,
        validation_state: "Valid",
        validation_results: {
          activeManifest: {
            success: [{ code: "claimSignature.validated" }],
            failure: [{ code: "signingCredential.untrusted" }],
          },
        },
      }),
    ).toBe(ContentCredentialTrust.Unverified);
  });

  it("does not trust a Trusted state the codes do not back", () => {
    const trusted = { ...C2PA_AI_IMAGE_STORE, validation_state: "Trusted" };
    expect(credentialTrustOf(trusted)).toBe(ContentCredentialTrust.Unverified);
    expect(
      credentialTrustOf({
        ...trusted,
        validation_results: {
          activeManifest: {
            ...TRUSTED_RESULTS.activeManifest,
            failure: [{ code: "signingCredential.revoked" }],
          },
        },
      }),
    ).toBe(ContentCredentialTrust.Unverified);
  });

  it("is invalid when the store does not verify", () => {
    expect(credentialTrustOf({ ...C2PA_AI_IMAGE_STORE, validation_state: "Invalid" })).toBe(
      ContentCredentialTrust.Invalid,
    );
    const { validation_state: _, ...stateless } = C2PA_AI_IMAGE_STORE;
    expect(
      credentialTrustOf({ ...stateless, validation_status: [{ code: "claimSignature.mismatch" }] }),
    ).toBe(ContentCredentialTrust.Invalid);
    // No state and no failure is not proof of anything.
    expect(credentialTrustOf(stateless)).toBe(ContentCredentialTrust.Unverified);
  });
});
