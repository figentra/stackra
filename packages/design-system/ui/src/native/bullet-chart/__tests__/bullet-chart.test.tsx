/**
 * Stackra file contract:
 * Purpose: proves the native BulletChart draws each row's label, value bar, qualitative bands (darkest nearest the
 *          start, every band after the third as light as the third) and target marker on one shared scale; a row
 *          without a target draws no marker and speaks an empty target; the chart is one image named by its label.
 * Boundary: React Native, Uniwind, Skia and the colour mixer are recording stand-ins that render plain DOM; the
 *           percentages and shades the chart hands its views are checked, not the drawing.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); WCAG 2.2 SC 1.1.1; ADR 0022 (test placement); STA-1371.
 */
// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

import type { DesignSystemState } from "#contracts/types/design-system-state.type";
import { BulletChart } from "#native/bullet-chart/bullet-chart";
import { DesignSystemContext } from "#native/design-system-provider/design-system-context";

type Style = Record<string, unknown>;

const state = vi.hoisted(() => ({ views: [] as Record<string, unknown>[] }));

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
vi.mock("#native/text/text", async () => {
  const { createElement } = await import("react");
  return {
    Text: (props: Record<string, unknown>) =>
      createElement("span", null, props["children"] as ReactNode),
  };
});
vi.mock("uniwind", () => ({ useCSSVariable: (names: string[]) => names }));
vi.mock("@shopify/react-native-skia", () => ({ Skia: { Color: () => [0.2, 0.4, 0.6, 1] } }));
vi.mock("#native/chart/mix-of.function", () => ({
  mixOf: (_color: string, _other: string, share: number) => `shade:${share}`,
}));

/** The styles of the views drawn with a background colour. */
const painted = (): Style[] =>
  state.views
    .map((view) => view["style"] as Style | undefined)
    .filter((style): style is Style => style?.["backgroundColor"] !== undefined);

/** Draws the chart in English. */
const draw = (node: ReactNode): void => {
  state.views = [];
  render(
    <DesignSystemContext value={{ locale: "en", direction: "ltr" } as DesignSystemState}>
      {node}
    </DesignSystemContext>,
  );
};

describe("BulletChart (native)", () => {
  it("draws the bands, the value bar and the target on one scale", () => {
    draw(
      <BulletChart
        label="Targets"
        items={[{ key: "r", label: "Revenue", value: 60, target: 80, ranges: [25, 50, 75, 100] }]}
      />,
    );
    expect(screen.getByText("Revenue")).toBeTruthy();
    expect(screen.getByText("60")).toBeTruthy();
    const styles = painted();
    const bands = styles.filter((style) => String(style["backgroundColor"]).startsWith("shade:"));
    expect(bands.map((band) => [band["start"], band["width"], band["backgroundColor"]])).toEqual([
      ["0%", "25%", "shade:0.3"],
      ["25%", "25%", "shade:0.17"],
      ["50%", "25%", "shade:0.07"],
      ["75%", "25%", "shade:0.07"],
    ]);
    expect(styles).toContainEqual(expect.objectContaining({ width: "60%", top: "30%" }));
    expect(styles).toContainEqual(expect.objectContaining({ start: "80%", marginStart: -1.5 }));
  });

  it("draws no marker without a target and is one image named by its label", () => {
    draw(<BulletChart label="Stock" items={[{ key: "s", label: "Stock", value: 5 }]} />);
    expect(painted().filter((style) => style["marginStart"] !== undefined)).toEqual([]);
    expect(painted()).toContainEqual(expect.objectContaining({ width: "100%", top: "30%" }));
    const image = state.views.find((view) => view["accessibilityRole"] === "image") ?? {};
    expect(image["accessibilityLabel"]).toBe("Stock");
    expect(image["accessibilityValue"]).toEqual({ text: "Stock: Value 5, Target " });
  });
});
