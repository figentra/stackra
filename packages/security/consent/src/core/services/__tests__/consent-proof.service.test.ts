/**
 * Stackra file contract:
 * Purpose: unit tests of `ConsentProofService` over `MemoryConsentProofStoreDriver`: a document is pending until its
 *          current version is accepted, a refusal or an older version never counts, an acceptance records the version,
 *          the hash and the channel, and a consent for another is recorded with the authority's relationship or
 *          refused when the authority knows none; the evidence trail lists every answer for a subject, oldest first,
 *          with who gave it, on whose behalf, the version and when, narrowed to one document on request.
 * Boundary: test only; a fixed clock and an authority that knows one guardian link.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; owner round 3 #29; OS-284; ADR 0454 (decision 5).
 */
import { Driver } from "@stackra/container";
import { Clock, type PublicId } from "@stackra/contracts";
import { beforeEach, describe, expect, it } from "@stackra/testing";

import { ConsentAuthority } from "#contracts/ports/consent-authority.port";
import { MemoryConsentProofStoreDriver } from "#core/drivers/memory-consent-proof-store.driver";
import { ConsentAuthorityMissingError } from "#core/errors/consent-authority-missing.error";
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
});
