/**
 * Stackra file contract:
 * Purpose: unit tests of `SavedViewSort` and its shipped schema: a row path with a direction parses, a key that is not a
 *          row path or an unknown direction fails.
 * Boundary: test only; validates through @stackra/validation.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0359 (decision 14).
 */
import { describe, expect, it } from "@stackra/testing";
import { schemaOf, validate } from "@stackra/validation";

import { SAVED_VIEW_SORT_SCHEMA } from "#core/constants/saved-view-sort-schema.constant";
import { SavedViewSort } from "#core/schemas/saved-view-sort.schema";

describe("SavedViewSort", () => {
  it("registers the shipped schema and parses a sort", () => {
    expect(schemaOf(SavedViewSort)).toBe(SAVED_VIEW_SORT_SCHEMA);
    expect(validate(SavedViewSort, { key: "totals.totalMinor", direction: "desc" }).success).toBe(
      true,
    );
  });

  it("refuses a bad path and an unknown direction", () => {
    expect(validate(SavedViewSort, { key: "a b", direction: "asc" }).success).toBe(false);
    expect(validate(SavedViewSort, { key: "createdAt", direction: "up" }).success).toBe(false);
  });
});
