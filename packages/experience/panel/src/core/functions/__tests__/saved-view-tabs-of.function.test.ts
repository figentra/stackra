/**
 * Stackra file contract:
 * Purpose: unit tests of `savedViewTabsOf`: the all-rows tab first and selected, then one tab per view, each drawing
 *          the caller's `render` for its view.
 * Boundary: test only; plain views and a recording `render`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0271 (decision 7).
 */
import { describe, expect, it } from "@stackra/testing";

import { savedViewTabsOf } from "#core/functions/saved-view-tabs-of.function";
import type { SavedView } from "#core/schemas/saved-view.schema";

const views = [
  { id: "view_1", name: "Open" },
  { id: "view_2", name: "Late" },
] as SavedView[];

describe("savedViewTabsOf", () => {
  it("lists the all-rows tab first and selected, then each view", () => {
    const tabs = savedViewTabsOf({
      label: "Saved views",
      allLabel: "All",
      views,
      render: (view) => view?.id ?? "none",
    });
    expect(tabs.label).toBe("Saved views");
    expect(tabs.defaultSelectedKeys).toEqual(["all"]);
    expect(tabs.items).toEqual([
      { id: "all", label: "All", content: "none" },
      { id: "view_1", label: "Open", content: "view_1" },
      { id: "view_2", label: "Late", content: "view_2" },
    ]);
  });
});
