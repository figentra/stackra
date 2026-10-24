/**
 * Stackra file contract:
 * Purpose: proves the native StackedMeter hands HeroUI Native Pro's StackedMeter `size`, `isDisabled` and the
 *          accessible name (`label` as `accessibilityLabel`), leaves out what the caller left out, passes every other
 *          prop through, and exposes HeroUI Native Pro's own nine parts.
 * Boundary: React Native does not render in vitest, so the heroui-native-pro subpath is replaced by a recording
 *          stand-in that renders plain DOM; what reaches HeroUI Native Pro is checked, not its rendering.
 * Runtime: node
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-416:FR-006
import { render } from "@testing-library/react";
import { StackedMeter as HeroStackedMeter } from "heroui-native-pro/stacked-meter";
import type { ReactNode } from "react";

import type { StackedMeterContractProps } from "#contracts/types/stacked-meter-contract-props.type";
import { StackedMeter, type StackedMeterProps } from "#native/stacked-meter/stacked-meter";

/** The props the root stand-in was last handed, as the real component would receive them. */
const received = vi.hoisted(() => ({ props: {} as Record<string, unknown> }));

vi.mock("heroui-native-pro/stacked-meter", async () => {
  const { createElement } = await import("react");
  const part = () => (props: Record<string, unknown>) =>
    createElement("div", null, props["children"] as ReactNode);
  const root = (props: Record<string, unknown>) => {
    received.props = props;
    return createElement("div", null, props["children"] as ReactNode);
  };
  return {
    StackedMeter: Object.assign(root, {
      Label: part(),
      Track: part(),
      TrackBackground: part(),
      Segment: part(),
      Legend: part(),
      LegendItem: part(),
      LegendIndicator: part(),
      LegendLabel: part(),
      LegendValue: part(),
    }),
  };
});

const SEGMENTS = [
  { id: "ts", label: "TypeScript", value: 4 },
  { id: "css", label: "CSS", value: 1 },
];

describe("StackedMeter (native)", () => {
  beforeEach(() => {
    received.props = {};
  });

  it("hands HeroUI Native Pro size and isDisabled and maps label to the accessibility label", () => {
    render(<StackedMeter segments={SEGMENTS} size="lg" isDisabled label="Languages" />);
    expect(received.props).toMatchObject({
      size: "lg",
      isDisabled: true,
      accessibilityLabel: "Languages",
    });
    expect(received.props).not.toHaveProperty("label");
  });

  it("leaves out the props the caller left out, so HeroUI Native Pro's defaults stay", () => {
    render(<StackedMeter segments={SEGMENTS} />);
    for (const name of ["size", "isDisabled", "accessibilityLabel"]) {
      expect(received.props).not.toHaveProperty(name);
    }
  });

  it("passes every other prop through unchanged", () => {
    render(
      <StackedMeter
        segments={SEGMENTS}
        maxValue={10}
        formatOptions={{ style: "percent" }}
        animation="disable-all"
        testID="found"
      />,
    );
    expect(received.props).toMatchObject({
      segments: SEGMENTS,
      maxValue: 10,
      formatOptions: { style: "percent" },
      animation: "disable-all",
      testID: "found",
    });
  });

  it.each([
    "Label",
    "Track",
    "TrackBackground",
    "Segment",
    "Legend",
    "LegendItem",
    "LegendIndicator",
    "LegendLabel",
    "LegendValue",
  ] as const)("exposes HeroUI Native Pro's own %s", (name) => {
    expect(StackedMeter[name]).toBe(HeroStackedMeter[name]);
  });

  it("extends its contract and refuses the name the contract owns", () => {
    expectTypeOf<StackedMeterProps>().toExtend<StackedMeterContractProps>();
    // @ts-expect-error the accessible name is `label`
    void (<StackedMeter segments={SEGMENTS} accessibilityLabel="x" />);
  });
});
