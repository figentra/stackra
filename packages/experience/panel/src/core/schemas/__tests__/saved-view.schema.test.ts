/**
 * Stackra file contract:
 * Purpose: unit tests of `SavedView` and its shipped schema: a view parses with its defaults (private, no filter, no
 *          totals, version 1, table layout), a grouped view with totals parses, a role copy and a board parse, and a key
 *          that is not a row path, an unknown aggregate, a sub-group without a group, a role copy without its role,
 *          a board without its path or a version below 1 fails.
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
      expect(result.data).toMatchObject({
        sharing: "private",
        filter: {},
        totals: [],
        version: 1,
        layout: "table",
      });
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

  it("parses a role copy laid out as a board", () => {
    const result = validate(SavedView, {
      ...base,
      sharing: "role",
      role: "orders.clerk",
      layout: "board",
      layoutBy: "status",
      version: 3,
    });
    expect(result.success).toBe(true);
  });

  it("refuses a role copy without a role, a board without its path and version 0", () => {
    expect(validate(SavedView, { ...base, sharing: "role" }).success).toBe(false);
    expect(validate(SavedView, { ...base, layout: "calendar" }).success).toBe(false);
    expect(validate(SavedView, { ...base, version: 0 }).success).toBe(false);
  });
});
