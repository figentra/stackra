/**
 * Stackra file contract:
 * Purpose: unit tests of `kmsKeyContext`: the tenant and key ids, under fixed names, and nothing else.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269; ADR 0415.
 */
import { describe, expect, it } from "@stackra/testing";

import { kmsKeyContext } from "#core/functions/kms-key-context.function";

describe("kmsKeyContext", () => {
  it("binds the tenant and the key id", () => {
    expect(kmsKeyContext("ten_01j9", "k1")).toEqual({
      "stackra:tenant": "ten_01j9",
      "stackra:key": "k1",
    });
  });
});
