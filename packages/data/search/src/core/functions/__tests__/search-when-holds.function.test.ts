/**
 * Stackra file contract:
 * Purpose: unit tests of `searchWhenHolds`: a row is searchable when every `when` field holds a listed value, through
 *          relations and with dates as ISO strings; always without `when`.
 * Boundary: test only; plain objects stand in for rows.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; stackra-302.
 */
import { describe, expect, it } from "@stackra/testing";

import { searchWhenHolds } from "#core/functions/search-when-holds.function";

describe(searchWhenHolds, () => {
  it("holds when each field holds one of its values", () => {
    const facet = {
      text: ["title"],
      when: { status: ["active", "featured"], "shop.open": [true] },
    };
    expect(searchWhenHolds({ status: "featured", shop: { open: true } }, facet)).toBe(true);
    expect(searchWhenHolds({ status: "draft", shop: { open: true } }, facet)).toBe(false);
    expect(searchWhenHolds({ status: "active", shop: { open: false } }, facet)).toBe(false);
    expect(searchWhenHolds({ status: "active" }, facet)).toBe(false);
  });

  it("compares a date as its ISO string", () => {
    expect(
      searchWhenHolds(
        { launch: new Date("2026-10-01T00:00:00.000Z") },
        { text: ["title"], when: { launch: ["2026-10-01T00:00:00.000Z"] } },
      ),
    ).toBe(true);
  });

  it("always holds without when", () => {
    expect(searchWhenHolds({ status: "draft" }, { text: ["title"] })).toBe(true);
  });
});
