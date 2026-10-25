/**
 * Stackra file contract:
 * Purpose: unit tests of `AssetHashMismatchError`: an Error that names the asset and both digests.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0234 (2026-10-24 note).
 */
import { describe, expect, it } from "@stackra/testing";

import { AssetHashMismatchError } from "#core/errors/asset-hash-mismatch.error";

describe("AssetHashMismatchError", () => {
  it("names the asset and both digests", () => {
    const error = new AssetHashMismatchError("legal::data/sa-rules.data.json", "aa", "bb");
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe("AssetHashMismatchError");
    expect(error).toMatchObject({
      key: "legal::data/sa-rules.data.json",
      expected: "aa",
      actual: "bb",
    });
    expect(error.message).toContain("legal::data/sa-rules.data.json");
  });
});
