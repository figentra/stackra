/**
 * Stackra file contract:
 * Purpose: unit tests of `verifyContentHash`: the same bytes verify, a changed byte or another prefix does not.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0365.
 */
import { describe, expect, it } from "@stackra/testing";

import { contentHashOf } from "#core/functions/content-hash-of.function";
import { verifyContentHash } from "#core/functions/verify-content-hash.function";

describe("verifyContentHash", () => {
  it("accepts the same bytes only", async () => {
    const bytes = new Uint8Array([1, 2, 3]);
    const hash = await contentHashOf(bytes);
    expect(await verifyContentHash(bytes, hash)).toBe(true);
    expect(await verifyContentHash(new Uint8Array([1, 2, 4]), hash)).toBe(false);
    expect(await verifyContentHash(bytes, hash.replace("sha256", "md5"))).toBe(false);
  });
});
