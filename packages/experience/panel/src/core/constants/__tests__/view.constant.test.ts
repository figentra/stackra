/**
 * Stackra file contract:
 * Purpose: unit tests of `View.of`: a frozen view node with a copied filter, an optional sort and an optional fixed
 *          list-query input (STA-1688).
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0307 (rule 9).
 */
import { SortDirection } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { View } from "#core/constants/view.constant";

describe("View", () => {
  it("builds a frozen view node", () => {
    const filter = { status: ["paid"] };
    const view = View.of("paid", filter, {
      sort: { key: "paidAt", direction: SortDirection.Desc },
    });
    expect(view).toEqual({ name: "paid", filter, sort: { key: "paidAt", direction: "desc" } });
    expect(view.filter).not.toBe(filter);
    expect(Object.isFrozen(view.filter)).toBe(true);
    expect(View.of("all", {})).toEqual({ name: "all", filter: {} });
    const input = { includeMerged: true };
    const merged = View.of("merged", {}, { input });
    expect(merged).toEqual({ name: "merged", filter: {}, input });
    expect(merged.input).not.toBe(input);
    expect(Object.isFrozen(merged.input)).toBe(true);
  });
});
