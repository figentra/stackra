/**
 * Stackra file contract:
 * Purpose: unit tests of `contentHashOf`: the SHA-256 test vector of "abc", prefixed with the algorithm.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0365.
 */
import { describe, expect, it } from "@stackra/testing";

import { contentHashOf } from "#core/functions/content-hash-of.function";

describe("contentHashOf", () => {
  it("is sha256:<hex>", async () => {
    expect(await contentHashOf(new TextEncoder().encode("abc"))).toBe(
      "sha256:ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    );
  });
});
