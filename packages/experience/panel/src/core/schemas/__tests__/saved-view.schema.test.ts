/**
 * Stackra file contract:
 * Purpose: unit tests of `SavedView` and its shipped schema: a view parses with its defaults (private, no filter, no
 *          totals), a grouped view with totals parses, and a key that is not a row path, an unknown aggregate or a
 *          sub-group without a group fails.
 * Boundary: test only; validates through @stackra/validation.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0359 (decision 14).
 */
import { describe, expect, it } from "@stackra/testing";
import { schemaOf, validate } from "@stackra/validation";

import { SAVED_VIEW_SCHEMA } from "#core/constants/saved-view-schema.constant";
import { SavedView } from "#core/schemas/saved-view.schema";

const base = { id: "view_1", resource: "orders.order", name: "Open", owner: "usr_1" };

describe("SavedView", () => {
  it("registers the shipped schema and applies its defaults", () => {
    expect(schemaOf(SavedView)).toBe(SAVED_VIEW_SCHEMA);
    const result = validate(SavedView, base);
    expect(result.success).toBe(true);
    if (result.success)
      expect(result.data).toMatchObject({ sharing: "private", filter: {}, totals: [] });
  });

  it("parses a grouped, shared view with totals", () => {
    const result = validate(SavedView, {
      ...base,
      sharing: "scope",
      sort: { key: "createdAt", direction: "desc" },
      // oxlint-disable-next-line unicorn/no-thenable -- reason: `then` is the saved view's sub-group key, not a promise
      group: { by: "status", then: "channel" },
      totals: [{ key: "totals.totalMinor", aggregate: "sum" }],
    });
    expect(result.success).toBe(true);
  });

  it("refuses bad paths, unknown aggregates and a sub-group alone", () => {
    expect(validate(SavedView, { ...base, columns: ["a b"] }).success).toBe(false);
    expect(
      validate(SavedView, { ...base, totals: [{ key: "x", aggregate: "median" }] }).success,
    ).toBe(false);
    // oxlint-disable-next-line unicorn/no-thenable -- reason: `then` is the saved view's sub-group key, not a promise
    expect(validate(SavedView, { ...base, group: { then: "channel" } }).success).toBe(false);
  });
});
