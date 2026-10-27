/**
 * Stackra file contract:
 * Purpose: unit tests of `AssetHashMismatchError`: an internal refusal whose details name the asset and both digests.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0234 (2026-10-24 note); ADR 0294 (R3); STA-344.
 */
import { describe, expect, it } from "@stackra/testing";

import { AssetHashMismatchError } from "#core/errors/asset-hash-mismatch.error";

describe("AssetHashMismatchError", () => {
  it("names the asset and both digests", () => {
    const error = AssetHashMismatchError.create({
      key: "legal::data/sa-rules.data.json",
      expected: "aa",
      actual: "bb",
    });
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe("AssetHashMismatchError");
    expect(error.code).toBe("asset_hash_mismatch");
    expect(error.category).toBe("internal");
    expect(error.details).toEqual({
      key: "legal::data/sa-rules.data.json",
      expected: "aa",
      actual: "bb",
    });
  });
});
