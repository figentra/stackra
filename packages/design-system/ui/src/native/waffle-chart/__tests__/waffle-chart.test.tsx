/**
 * Stackra file contract:
 * Purpose: proves the native WaffleChart is one image whose value reads each part's value and share, draws every
 *          square once measured with each part's count in its colour, and lists the parts in the legend.
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
import { WaffleChart } from "#native/waffle-chart/waffle-chart";

const state = vi.hoisted(() => ({
  views: [] as Record<string, unknown>[],
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
  };
});
vi.mock("#native/text/text", () => ({
  Text: (props: Record<string, unknown>) => {
    state.texts.push(String(props["children"]));
    return null;
  },
}));
vi.mock("uniwind", () => ({
  // Each colour name gets its own value so the squares can be counted per part.
  useCSSVariable: (names: string[]) => names.map((name) => name),
}));
vi.mock("@shopify/react-native-skia", () => ({ Skia: { Color: () => [0.2, 0.4, 0.6, 1] } }));

const DATA = [
  { method: "card", orders: 620 },
  { method: "cod", orders: 250 },
  { method: "wallet", orders: 130 },
];
const SERIES = [
  { key: "card", label: "Card" },
  { key: "cod", label: "Cash on delivery" },
  { key: "wallet", label: "Wallet" },
];

describe("WaffleChart (native)", () => {
  it("speaks each share, draws every square by share and lists the parts", () => {
    render(
      <DesignSystemContext value={{ locale: "en", direction: "ltr" } as DesignSystemState}>
        <WaffleChart
          data={DATA}
          series={SERIES}
          nameKey="method"
          valueKey="orders"
          label="Payments"
        />
      </DesignSystemContext>,
    );
    const image = state.views.find((view) => view["accessibilityRole"] === "image") ?? {};
    expect(image["accessibilityValue"]).toEqual({
      text: "Card: Value 620, Share 62%; Cash on delivery: Value 250, Share 25%; Wallet: Value 130, Share 13%",
    });
    const measured = state.views.find((view) => typeof view["onLayout"] === "function");
    state.views.length = 0;
    act(() => {
      (measured?.["onLayout"] as (event: unknown) => void)?.({
        nativeEvent: { layout: { width: 300 } },
      });
    });
    const squares = state.views
      .map((view) => view["style"] as { width?: number; backgroundColor?: string } | undefined)
      .filter((style) => style?.width === 18);
    expect(squares).toHaveLength(100);
    const count = (color: string) =>
      squares.filter((style) => style?.backgroundColor === `--color-${color}`).length;
    expect([count("chart-1"), count("chart-2"), count("chart-3")]).toEqual([62, 25, 13]);
    expect(state.texts.slice(-9).join("|")).toBe(
      "Card|620|62%|Cash on delivery|250|25%|Wallet|130|13%",
    );
  });
});
