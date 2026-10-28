/**
 * Stackra file contract:
 * Purpose: unit tests of `decodeConsentSnapshot`: a truncated, oversized, mis-shaped or non-base64url token decodes to
 *          `null` without throwing.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0472 (decisions 2 and 4).
 */
import { base64url } from "@stackra/support";
import { describe, expect, it } from "@stackra/testing";

import type { ConsentSnapshot } from "#contracts/types/consent-snapshot.type";
import { decodeConsentSnapshot } from "#core/functions/decode-consent-snapshot.function";

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

/** The base64url of `value`'s JSON. */
function segment(value: unknown): string {
  return base64url.encode(new TextEncoder().encode(JSON.stringify(value)));
}

describe(decodeConsentSnapshot, () => {
  it.each([
    ["an empty token", ""],
    ["two segments", `${segment(SNAPSHOT)}.a2V5`],
    ["four segments", `${segment(SNAPSHOT)}.a2V5.c2ln.eA`],
    ["an empty signature", `${segment(SNAPSHOT)}.a2V5.`],
    ["a payload that is not JSON", "bm90IGpzb24.a2V5.c2ln"],
    ["a payload of the wrong shape", `${segment({ id: "csn_1" })}.a2V5.c2ln`],
    ["a character outside base64url", `${segment(SNAPSHOT)}.a2V5.c2ln!`],
    ["an oversized token", `${"a".repeat(8193)}.a2V5.c2ln`],
  ])("reads %s as null", (_case, token) => {
    expect(decodeConsentSnapshot(token)).toBeNull();
  });
});
