/**
 * Stackra file contract:
 * Purpose: proves the native distribution charts: each is one `image` named by its label whose value reads every
 *          number in the locale (Arabic-Indic digits when asked): the histogram's bins, the box plot's summary, the
 *          range bar's low and high and the bullet chart's value and target; pressing a bin shows its readout.
 * Boundary: React Native, Skia and Uniwind do not run in vitest, so they are recording stand-ins rendering plain DOM.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); ADR 0060; WCAG 2.2 SC 1.1.1; ADR 0022 (test placement); STA-1371.
 */
// @vitest-environment jsdom
import { act, render } from "@testing-library/react";
import type { ReactNode } from "react";

import type { DesignSystemState } from "#contracts/types/design-system-state.type";
import { BoxPlotChart } from "#native/box-plot-chart/box-plot-chart";
import { BulletChart } from "#native/bullet-chart/bullet-chart";
import { DesignSystemContext } from "#native/design-system-provider/design-system-context";
import { HistogramChart } from "#native/histogram-chart/histogram-chart";
import { RangeBarChart } from "#native/range-bar-chart/range-bar-chart";

const state = vi.hoisted(() => ({
  images: [] as Record<string, unknown>[],
  presses: [] as Record<string, unknown>[],
}));

vi.mock("react-native", async () => {
  const { createElement } = await import("react");
  return {
    I18nManager: { isRTL: false },
    View: (props: Record<string, unknown>) => {
      if (props["accessibilityRole"] === "image") state.images.push(props);
      return createElement("div", null, props["children"] as ReactNode);
    },
    Pressable: (props: Record<string, unknown>) => {
      state.presses.push(props);
      return createElement("button", { type: "button" }, props["children"] as ReactNode);
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

vi.mock("uniwind", () => ({
  useCSSVariable: (names: string[]) => names.map(() => "#336699"),
}));

vi.mock("@shopify/react-native-skia", () => ({ Skia: { Color: () => [0.2, 0.4, 0.6, 1] } }));

/** Renders in a provider of the given locale. */
const within = (locale: string, node: ReactNode) =>
  render(
    <DesignSystemContext
      value={{ locale, direction: locale.startsWith("ar") ? "rtl" : "ltr" } as DesignSystemState}
    >
      {node}
    </DesignSystemContext>,
  );

/** What the last image speaks. */
const spoken = () =>
  (state.images.at(-1)?.["accessibilityValue"] as { text: string } | undefined)?.text;

beforeEach(() => {
  state.images.length = 0;
  state.presses.length = 0;
});

describe("native distribution charts", () => {
  it("a histogram speaks each bin and shows a pressed bin's count", () => {
    const { container } = within(
      "en",
      <HistogramChart values={[1, 2, 2, 9]} binCount={2} label="Order totals" />,
    );
    expect(state.images.at(-1)?.["accessibilityLabel"]).toBe("Order totals");
    expect(spoken()).toBe("1–5: 3; 5–9: 1");
    act(() => (state.presses[0]?.["onPressIn"] as () => void)?.());
    expect(container.textContent).toContain("Count3");
  });

  it("a box plot speaks each group's summary in Arabic digits (English words without a catalogue)", () => {
    within(
      "ar-u-nu-arab",
      <BoxPlotChart
        groups={[{ key: "a", label: "الرياض", values: [1, 2, 3, 4, 100] }]}
        label="زمن التوصيل"
      />,
    );
    expect(spoken()).toBe(
      "الرياض: Minimum ١، Lower quartile ٢، Median ٣، Upper quartile ٤، Maximum ١٠٠، Outliers ١٠٠",
    );
  });

  it("a range bar speaks each low and high and leaves a gap empty", () => {
    within(
      "en",
      <RangeBarChart
        data={[
          { day: "Sun", low: 21, high: 34 },
          { day: "Mon", low: null, high: 33 },
        ]}
        xKey="day"
        fromKey="low"
        toKey="high"
        label="Temperature"
        orientation="horizontal"
      />,
    );
    expect(spoken()).toBe("Sun: Low 21, High 34; Mon: Low , High 33");
  });

  it("a bullet chart speaks each value and target", () => {
    within(
      "en",
      <BulletChart
        items={[{ key: "r", label: "Revenue", value: 1200, target: 1500, ranges: [2000] }]}
        label="Targets"
      />,
    );
    expect(spoken()).toBe("Revenue: Value 1,200, Target 1,500");
  });
});
