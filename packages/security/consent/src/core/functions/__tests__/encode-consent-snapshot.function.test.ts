/**
 * Stackra file contract:
 * Purpose: unit tests of `encodeConsentSnapshot`: a token is three base64url segments, decodes back to the same
 *          snapshot and key id, and its signature verifies over the first segment.
 * Boundary: test only; signs with a fresh in-memory ES256 key.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0472 (decision 2); ADR 0416.
 */
import { MemorySignerDriver, verifySignature } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import type { ConsentSnapshot } from "#contracts/types/consent-snapshot.type";
import { decodeConsentSnapshot } from "#core/functions/decode-consent-snapshot.function";
import { encodeConsentSnapshot } from "#core/functions/encode-consent-snapshot.function";

/** A granted analytics snapshot. */
const SNAPSHOT: ConsentSnapshot = {
  id: "csn_1",
  subject: "anon_1",
  policyVersion: "2026-10",
  granted: ["necessary", "analytics"],
  refused: ["marketing"],
  regime: "gdpr",
  region: "DE",
  globalPrivacyControl: false,
  decidedAt: "2026-10-28T08:00:00.000Z",
  issuedAt: "2026-10-28T09:00:00.000Z",
  expiresAt: "2026-10-29T09:00:00.000Z",
};

describe(encodeConsentSnapshot, () => {
  it("writes three segments that decode back and verify", async () => {
    const signer = await MemorySignerDriver.generate("consent-1");
    const token = await encodeConsentSnapshot(SNAPSHOT, signer);
    expect(token.split(".")).toHaveLength(3);
    const decoded = decodeConsentSnapshot(token);
    expect(decoded?.snapshot).toEqual(SNAPSHOT);
    expect(decoded?.signature.keyId).toBe("consent-1");
    if (decoded === null) throw new Error("not decoded");
    expect(
      await verifySignature(await signer.publicKey(), decoded.message, decoded.signature),
    ).toBe(true);
  });
});
