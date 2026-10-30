/**
 * Stackra file contract:
 * Purpose: proves the native PolarChart is one image whose value reads every number in the locale, draws one Skia
 *          slice per row and series once measured (none for a missing value), and writes the sector names as Text,
 *          never Skia text.
 * Boundary: React Native, Skia and Uniwind do not run in vitest, so they are recording stand-ins that render plain
 *           DOM; what the chart hands them is checked, not the drawing.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement); WCAG 2.2 SC 1.1.1; STA-1371 (wave D, owner
 *          approval 2026-10-30).
 */
// @vitest-environment jsdom
import { act, render } from "@testing-library/react";
import type { ReactNode } from "react";

import type { DesignSystemState } from "#contracts/types/design-system-state.type";
import { DesignSystemContext } from "#native/design-system-provider/design-system-context";
import { PolarChart } from "#native/polar-chart/polar-chart";

const state = vi.hoisted(() => ({
  views: [] as Record<string, unknown>[],
  paths: [] as Record<string, unknown>[],
  texts: [] as string[],
}));

vi.mock("react-native", async () => {
  const { createElement } = await import("react");
  return {
    I18nManager: { isRTL: false },
    View: (props: Record<string, unknown>) => {
      state.views.push(props);
      return createElement("div", null, props["children"] as ReactNode);
    },
    Pressable: () => null,
  };
});
vi.mock("#native/text/text", () => ({
  Text: (props: Record<string, unknown>) => {
    state.texts.push(String(props["children"]));
    return null;
  },
}));
vi.mock("uniwind", () => ({
  useCSSVariable: (names: string[]) => names.map(() => "#336699"),
}));
vi.mock("@shopify/react-native-skia", () => ({
  Skia: { Color: () => [0.2, 0.4, 0.6, 1] },
  Canvas: (props: { children?: ReactNode }) => props.children,
  Circle: () => null,
  Path: (props: Record<string, unknown>) => {
    state.paths.push(props);
    return null;
  },
}));

const DATA = [
  { day: "Sat", store: 1200, online: 800 },
  { day: "Sun", store: 900 },
];
const SERIES = [
  { key: "store", label: "In store" },
  { key: "online", label: "Online" },
];

describe("PolarChart (native)", () => {
  it("speaks its numbers, draws a slice per value and names sectors with Text", () => {
    render(
      <DesignSystemContext value={{ locale: "en", direction: "ltr" } as DesignSystemState}>
        <PolarChart data={DATA} series={SERIES} xKey="day" label="Orders" />
      </DesignSystemContext>,
    );
    const image = state.views.find((view) => view["accessibilityRole"] === "image") ?? {};
    expect(image["accessibilityLabel"]).toBe("Orders");
    expect(image["accessibilityValue"]).toEqual({
      text: "Sat: In store 1,200, Online 800; Sun: In store 900, Online ",
    });
    expect(state.paths).toHaveLength(0);
    const measured = state.views.find((view) => typeof view["onLayout"] === "function");
    act(() => {
      (measured?.["onLayout"] as (event: unknown) => void)?.({
        nativeEvent: { layout: { width: 320 } },
      });
    });
    // A fill (no stroke style) for each of the three values.
    expect(state.paths.filter((path) => path["style"] === undefined)).toHaveLength(3);
    expect(state.texts).toEqual(expect.arrayContaining(["Sat", "Sun"]));
  });
});
