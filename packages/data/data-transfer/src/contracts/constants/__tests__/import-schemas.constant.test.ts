/**
 * Stackra file contract:
 * Purpose: unit tests of `RowError$` and `ImportChange$`: a refused row and a created or updated record parse, and a
 *          row number 0 or a change with no key is refused.
 * Boundary: test only; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0294 (decision 26); STA-1284.
 */
import { describe, expect, it } from "@stackra/testing";

import { IMPORT_CHANGE_SCHEMA } from "#contracts/constants/import-change-schema.constant";
import { ROW_ERROR_SCHEMA } from "#contracts/constants/row-error-schema.constant";

describe("RowError$ and ImportChange$", () => {
  it("parses a refused row and both kinds of change", () => {
    const error = {
      sheet: "Products",
      row: 3,
      issues: [{ field: "price", code: "invalid_type", message: "Expected number" }],
    };
    expect(ROW_ERROR_SCHEMA.parse(error)).toEqual(error);
    expect(IMPORT_CHANGE_SCHEMA.parse({ key: "SKU-1", before: null })).toEqual({
      key: "SKU-1",
      before: null,
    });
    expect(IMPORT_CHANGE_SCHEMA.parse({ key: "SKU-2", before: { price: 10 } })).toEqual({
      key: "SKU-2",
      before: { price: 10 },
    });
  });

  it("refuses row 0 and a change with no key", () => {
    expect(ROW_ERROR_SCHEMA.safeParse({ sheet: "Products", row: 0, issues: [] }).success).toBe(
      false,
    );
    expect(IMPORT_CHANGE_SCHEMA.safeParse({ key: "", before: null }).success).toBe(false);
  });
});
