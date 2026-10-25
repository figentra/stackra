/**
 * Stackra file contract:
 * Purpose: unit tests of `matchColumns`: matches by name or label after normalisation, one header per field, unmatched
 *          fields left out.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0367 (decision 5).
 */
import { describe, expect, it } from "@stackra/testing";

import { matchColumns } from "#core/functions/match-columns.function";

describe("matchColumns", () => {
  it("proposes a mapping from names and labels", () => {
    expect(
      matchColumns(
        ["رمز المُنتج", "Price", ""],
        [
          { name: "sku", labels: ["SKU", "رمز المنتج"] },
          { name: "price", labels: [] },
          { name: "cost", labels: ["price"] },
          { name: "stock", labels: ["المخزون"] },
        ],
      ),
    ).toEqual({ sku: "رمز المُنتج", price: "Price" });
  });
});
