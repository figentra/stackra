/**
 * Stackra file contract:
 * Purpose: unit tests of `linkConsentProof`: the first link follows 64 zeros at sequence 1, the next follows its head's
 *          hash, the hash covers the proof (any change of a field changes it), only the proof's own fields are kept,
 *          the instant is kept in the form a timestamp column gives back, and an instant that is not a date is
 *          refused.
 * Boundary: test only; pure, Web Crypto.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0212 (decision 3); ADR 0454 (decision 5); STA-2818.
 */
import type { PublicId } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import type { ConsentProof } from "#contracts/types/consent-proof.type";
import { linkConsentProof } from "#core/functions/link-consent-proof.function";

const RANA = "usr_01j9z3k4m5n6p7q8r9s0t1v2r1" as PublicId;

const PROOF: ConsentProof = {
  subject: RANA,
  givenBy: RANA,
  document: "terms",
  version: "2026-10",
  contentHash: "h1",
  granted: true,
  at: "2026-10-25T09:00:00.000Z",
  channel: "signup",
};

describe("linkConsentProof", () => {
  it("starts a chain after 64 zeros and chains the next after its head", async () => {
    const first = await linkConsentProof(PROOF);
    expect(first).toMatchObject({ ...PROOF, sequence: 1, previousHash: "0".repeat(64) });
    expect(first.hash).toMatch(/^[0-9a-f]{64}$/);
    const second = await linkConsentProof({ ...PROOF, version: "2027-01" }, first);
    expect(second).toMatchObject({ sequence: 2, previousHash: first.hash });
    expect(second.hash).not.toBe(first.hash);
  });

  it("hashes every proof field", async () => {
    const base = (await linkConsentProof(PROOF)).hash;
    for (const change of [
      { granted: false },
      { version: "2026-11" },
      { contentHash: "h2" },
      { givenBy: "usr_01j9z3k4m5n6p7q8r9s0t1v2p1" as PublicId },
      { relationship: "guardian" },
      { channel: "kiosk" },
      { verificationReference: "cgl_1" },
    ] satisfies Partial<ConsentProof>[]) {
      expect((await linkConsentProof({ ...PROOF, ...change })).hash).not.toBe(base);
    }
  });

  it("keeps only the proof's own fields, and the instant as a timestamp reads back", async () => {
    const link = await linkConsentProof({
      ...PROOF,
      at: "2026-10-25T11:00:00+02:00",
      extra: "dropped",
    } as ConsentProof);
    expect(link.at).toBe("2026-10-25T09:00:00.000Z");
    expect("extra" in link).toBe(false);
    expect(Object.keys(link).sort()).toEqual(
      [...Object.keys(PROOF), "sequence", "previousHash", "hash"].sort(),
    );
    expect(link.hash).toBe((await linkConsentProof(PROOF)).hash);
  });

  it("refuses an instant that is not a date", async () => {
    await expect(linkConsentProof({ ...PROOF, at: "yesterday" })).rejects.toBeInstanceOf(
      RangeError,
    );
  });
});
