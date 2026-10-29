/**
 * Stackra file contract:
 * Purpose: unit tests of `SavedViewTotal` and its shipped schema: a row path with an aggregate parses, an unknown
 *          aggregate or a key that is not a row path fails.
 * Boundary: test only; validates through @stackra/validation.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0359 (decision 14).
 */
import { describe, expect, it } from "@stackra/testing";
import { schemaOf, validate } from "@stackra/validation";

import { SAVED_VIEW_TOTAL_SCHEMA } from "#core/constants/saved-view-total-schema.constant";
import { SavedViewTotal } from "#core/schemas/saved-view-total.schema";

describe("SavedViewTotal", () => {
  it("registers the shipped schema and parses a total", () => {
    expect(schemaOf(SavedViewTotal)).toBe(SAVED_VIEW_TOTAL_SCHEMA);
    expect(validate(SavedViewTotal, { key: "totals.totalMinor", aggregate: "sum" }).success).toBe(
      true,
    );
  });

  it("refuses an unknown aggregate and a bad path", () => {
    expect(validate(SavedViewTotal, { key: "x", aggregate: "median" }).success).toBe(false);
    expect(validate(SavedViewTotal, { key: "x.", aggregate: "sum" }).success).toBe(false);
  });
});
