/**
 * Stackra file contract:
 * Purpose: unit tests of `compileMapping`: headers matched after normalisation, first duplicate wins, empty cells and
 *          missing columns leave the field out.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0367 (decision 5).
 */
import { describe, expect, it } from "@stackra/testing";

import { compileMapping } from "#core/functions/compile-mapping.function";

describe("compileMapping", () => {
  it("maps cells to fields by normalised header", () => {
    const toRecord = compileMapping(["الإسم", "Price", "price", "Notes"], {
      name: "الاسم",
      price: "PRICE",
      stock: "Stock",
      notes: "notes",
    });
    expect(toRecord(["قلم", "5", "6", ""])).toEqual({ name: "قلم", price: "5" });
    expect(toRecord(["قلم"])).toEqual({ name: "قلم" });
  });
});
