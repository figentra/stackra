/**
 * Stackra file contract:
 * Purpose: unit tests of `ConsentProofService` over `MemoryConsentProofStoreDriver`: a document is pending until its
 *          current version is accepted, a refusal or an older version never counts, an acceptance records the version,
 *          the hash and the channel, and a consent for another is recorded with the authority's relationship or
 *          refused when the authority knows none; the evidence trail lists every answer for a subject, oldest first,
 *          with who gave it, on whose behalf, the version and when, narrowed to one document on request; a consent the
 *          market pack wants verified is recorded with the method and the verifier's reference only when the verifier
 *          passes it, and refused, writing nothing, when it does not or when the kit's `none` verifier runs.
 * Boundary: test only; a fixed clock, an authority that knows one guardian link and a verifier that passes one card
 *           check.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; owner round 3 #29; OS-284; ADR 0454 (decision 5); STA-1323.
 */
import { Driver } from "@stackra/container";
import { Clock, type PublicId } from "@stackra/contracts";
import { beforeEach, describe, expect, it } from "@stackra/testing";

import { ConsentVerificationMethod } from "#contracts/enums/consent-verification-method.enum";
import { ConsentAuthority } from "#contracts/ports/consent-authority.port";
import { ConsentVerifier } from "#contracts/ports/consent-verifier.port";
import type { ConsentVerificationRequest } from "#contracts/types/consent-verification-request.type";
import { MemoryConsentProofStoreDriver } from "#core/drivers/memory-consent-proof-store.driver";
import { NoneConsentVerifierDriver } from "#core/drivers/none-consent-verifier.driver";
import { ConsentAuthorityMissingError } from "#core/errors/consent-authority-missing.error";
import { ConsentNotVerifiedError } from "#core/errors/consent-not-verified.error";
import { ConsentProofService } from "#core/services/consent-proof.service";
import type { TermsDocument } from "#core/types/terms-document.type";

/** Always 2026-10-25 09:00 UTC. */
class FixedClockDriver extends Driver(Clock) {
  now(): Date {
    return new Date("2026-10-25T09:00:00Z");
  }
}

const PARENT = "usr_01j9z3k4m5n6p7q8r9s0t1v2p1";
const CHILD = "usr_01j9z3k4m5n6p7q8r9s0t1v2c1";
const STRANGER = "usr_01j9z3k4m5n6p7q8r9s0t1v2s1";

/** Knows that the parent is the child's guardian for photos. */
class OneLinkAuthorityDriver extends Driver(ConsentAuthority) {
  async relationshipOf(givenBy: PublicId, subject: PublicId, document: string) {
    return givenBy === PARENT && subject === CHILD && document === "photos"
      ? "guardian"
      : undefined;
  }
}

/** Passes one card check, `auth_ok`, for the parent; answers its own reference. */
class OneCardCheckVerifierDriver extends Driver(ConsentVerifier) {
  async verify(request: ConsentVerificationRequest) {
    return request.method === ConsentVerificationMethod.CardCheck &&
      request.givenBy === PARENT &&
      request.evidence === "auth_ok"
      ? { verified: true, reference: "chk_1" }
      : { verified: false };
  }
}

const TERMS_1: TermsDocument = {
  key: "terms",
  version: "2026-01",
  required: true,
  contentHash: "h1",
};
const TERMS_2: TermsDocument = {
  key: "terms",
  version: "2026-10",
  required: true,
  contentHash: "h2",
};
const PHOTOS: TermsDocument = { key: "photos", version: "1", required: false };

describe("ConsentProofService", () => {
  let proofs: ConsentProofService;

  beforeEach(() => {
    proofs = new ConsentProofService(
      new MemoryConsentProofStoreDriver(),
      new OneLinkAuthorityDriver(),
      new FixedClockDriver(),
      new OneCardCheckVerifierDriver(),
    );
  });

  it("keeps a document pending until its current version is accepted", async () => {
    expect(await proofs.pending(PARENT, [TERMS_1, PHOTOS])).toEqual([TERMS_1, PHOTOS]);
    const proof = await proofs.answer(PARENT, TERMS_1, true, "signup");
    expect(proof).toEqual({
      subject: PARENT,
      givenBy: PARENT,
      document: "terms",
      version: "2026-01",
      contentHash: "h1",
      granted: true,
      channel: "signup",
      at: "2026-10-25T09:00:00.000Z",
    });
    expect(await proofs.pending(PARENT, [TERMS_1])).toEqual([]);
    expect(await proofs.pending(PARENT, [TERMS_2])).toEqual([TERMS_2]);
  });

  it("never counts a refusal", async () => {
    await proofs.answer(PARENT, TERMS_2, false);
    expect(await proofs.pending(PARENT, [TERMS_2])).toEqual([TERMS_2]);
    expect((await proofs.current(PARENT, "terms"))?.granted).toBe(false);
  });

  it("records a consent for another with the authority's relationship", async () => {
    const proof = await proofs.answerFor(CHILD, PARENT, PHOTOS, true);
    expect(proof.relationship).toBe("guardian");
    expect(proof.subject).toBe(CHILD);
    expect(proof.givenBy).toBe(PARENT);
    expect(await proofs.pending(CHILD, [PHOTOS])).toEqual([]);
  });

  it("refuses a consent the authority does not back, and a self-answer through answerFor", async () => {
    await expect(proofs.answerFor(CHILD, STRANGER, PHOTOS, true)).rejects.toBeInstanceOf(
      ConsentAuthorityMissingError,
    );
    await expect(proofs.answerFor(CHILD, PARENT, TERMS_2, true)).rejects.toBeInstanceOf(
      ConsentAuthorityMissingError,
    );
    await expect(proofs.answerFor(CHILD, CHILD, PHOTOS, true)).rejects.toThrow(RangeError);
  });

  it("lists the evidence trail: who, which version, when and on whose behalf", async () => {
    await proofs.answer(CHILD, TERMS_2, true, "signup");
    await proofs.answerFor(CHILD, PARENT, PHOTOS, true, "settings");

    const trail = await proofs.evidence(CHILD);
    expect(trail.map((proof) => [proof.document, proof.givenBy, proof.relationship])).toEqual([
      ["terms", CHILD, undefined],
      ["photos", PARENT, "guardian"],
    ]);
    expect(trail[1]).toMatchObject({
      subject: CHILD,
      version: "1",
      granted: true,
      at: "2026-10-25T09:00:00.000Z",
      channel: "settings",
    });
    expect((await proofs.evidence(CHILD, "photos")).map((proof) => proof.document)).toEqual([
      "photos",
    ]);
    expect(await proofs.evidence(STRANGER)).toEqual([]);
  });

  it("records a verified consent for another with the method and the verifier's reference", async () => {
    const card = { method: ConsentVerificationMethod.CardCheck, evidence: "auth_ok" };
    const proof = await proofs.answerFor(CHILD, PARENT, PHOTOS, true, "kiosk", card);
    expect(proof).toMatchObject({
      relationship: "guardian",
      verificationMethod: "card_check",
      verificationReference: "chk_1",
    });
    expect((await proofs.evidence(CHILD))[0]?.verificationMethod).toBe("card_check");
  });

  it("refuses a consent whose verification fails, and records nothing", async () => {
    const failed = { method: ConsentVerificationMethod.CardCheck, evidence: "auth_declined" };
    await expect(
      proofs.answerFor(CHILD, PARENT, PHOTOS, true, undefined, failed),
    ).rejects.toBeInstanceOf(ConsentNotVerifiedError);
    const form = { method: ConsentVerificationMethod.SignedForm, evidence: "auth_ok" };
    await expect(
      proofs.answerFor(CHILD, PARENT, PHOTOS, true, undefined, form),
    ).rejects.toBeInstanceOf(ConsentNotVerifiedError);
    expect(await proofs.evidence(CHILD)).toEqual([]);
  });

  it("fails closed under the kit's none verifier", async () => {
    const closed = new ConsentProofService(
      new MemoryConsentProofStoreDriver(),
      new OneLinkAuthorityDriver(),
      new FixedClockDriver(),
      new NoneConsentVerifierDriver(),
    );
    const card = { method: ConsentVerificationMethod.CardCheck, evidence: "auth_ok" };
    await expect(
      closed.answerFor(CHILD, PARENT, PHOTOS, true, undefined, card),
    ).rejects.toBeInstanceOf(ConsentNotVerifiedError);
    // with no method named, the authority alone suffices, as before
    await expect(closed.answerFor(CHILD, PARENT, PHOTOS, true)).resolves.toMatchObject({
      relationship: "guardian",
    });
  });
});
