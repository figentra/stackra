/**
 * Stackra file contract:
 * Purpose: unit tests of `WidgetDisplay`: KPI, KPI group, progress, list (on `items` by default), view and custom nodes.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0307 (rules 14 and 15).
 */
import { Tone } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { WidgetDisplay } from "#core/constants/widget-display.constant";

/** Stands in for the icon constants gen emits in an app. */
const TestIcons = {
  Banknote: "banknote",
} as const;

describe("WidgetDisplay", () => {
  it("builds frozen display nodes", () => {
    const kpi = WidgetDisplay.kpi("revenue", {
      icon: TestIcons.Banknote,
      tones: [{ belowTarget: 0.8, tone: Tone.Danger }],
    });
    expect(kpi).toEqual({
      kind: "kpi",
      path: "revenue",
      icon: TestIcons.Banknote,
      tones: [{ belowTarget: 0.8, tone: "danger" }],
    });
    expect(WidgetDisplay.kpiGroup([kpi])).toEqual({ kind: "kpi_group", kpis: [kpi] });
    expect(WidgetDisplay.progress("revenue")).toEqual({ kind: "progress", path: "revenue" });
    expect(WidgetDisplay.list({ primary: "variantId" })).toEqual({
      kind: "list",
      path: "items",
      primary: "variantId",
    });
    expect(WidgetDisplay.view("awaiting_payment", { limit: 10 })).toEqual({
      kind: "view",
      view: "awaiting_payment",
      limit: 10,
    });
    expect(WidgetDisplay.custom()).toEqual({ kind: "custom" });
    expect(Object.isFrozen(kpi)).toBe(true);
  });
});
