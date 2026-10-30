/**
 * Stackra file contract:
 * Purpose: proves `reconcileDashboardLayout` keeps a saved layout's order and sizes for tiles that still exist, adds
 *          new tiles at the end, and drops anything that is not a known tile with a known size.
 * Boundary: pure function; no DOM.
 * Runtime: node
 * Governing contract: ADR 0022 (test placement); ADR 0307 (decision 18); STA-1371.
 */
import type { DashboardLayout } from "#contracts/types/dashboard-layout.type";
import { reconcileDashboardLayout } from "#core/functions/reconcile-dashboard-layout.function";

const DEFAULTS: DashboardLayout = [
  { id: "revenue", size: "small" },
  { id: "orders", size: "small" },
  { id: "trend", size: "large" },
];

describe("reconcileDashboardLayout", () => {
  it("keeps the saved order and sizes, then adds the tiles saved before they existed", () => {
    expect(
      reconcileDashboardLayout(
        [
          { id: "trend", size: "full" },
          { id: "revenue", size: "medium" },
        ],
        DEFAULTS,
      ),
    ).toEqual([
      { id: "trend", size: "full" },
      { id: "revenue", size: "medium" },
      { id: "orders", size: "small" },
    ]);
  });

  it("drops unknown tiles, unknown sizes, duplicates and junk", () => {
    expect(
      reconcileDashboardLayout(
        [
          { id: "gone", size: "small" },
          { id: "orders", size: "huge" },
          { id: "trend", size: "medium" },
          { id: "trend", size: "full" },
          null,
          7,
        ],
        DEFAULTS,
      ),
    ).toEqual([
      { id: "trend", size: "medium" },
      { id: "revenue", size: "small" },
      { id: "orders", size: "small" },
    ]);
  });

  it("returns the defaults for a value that is not a list", () => {
    expect(reconcileDashboardLayout({ layout: [] }, DEFAULTS)).toBe(DEFAULTS);
    expect(reconcileDashboardLayout(null, DEFAULTS)).toBe(DEFAULTS);
  });
});
