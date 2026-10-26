/**
 * Stackra file contract:
 * Purpose: proves the native WheelPickerGroup hands HeroUI Native Pro's WheelPickerGroup `isDisabled` and the accessible name (`label` as
 *          `accessibilityLabel`), leaves out what the caller left out, passes every other prop through
 *          (`itemHeight`, `visibleCount` and `onValuesChange` among them), exposes HeroUI Native Pro's own parts and hook, and refuses
 *          HeroUI's two spellings of the accessible name.
 * Boundary: React Native does not render in vitest, so the heroui-native-pro subpath is replaced by a recording
 *          stand-in that renders plain DOM; what reaches HeroUI Native Pro is checked, not its rendering.
 * Runtime: node
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-416:FR-010
import { render } from "@testing-library/react";
import {
  WheelPickerGroup as HeroWheelPickerGroup,
  useWheelPickerGroup as HeroUseWheelPickerGroup,
} from "heroui-native-pro/wheel-picker-group";
import type { ReactNode } from "react";

import type { WheelPickerGroupContractProps } from "#contracts/types/wheel-picker-group-contract-props.type";
import {
  WheelPickerGroup,
  useWheelPickerGroup,
} from "#native/wheel-picker-group/wheel-picker-group";
import type { WheelPickerGroupProps } from "#native/wheel-picker-group/wheel-picker-group.props";

/** The props the root stand-in was last handed, as the real component would receive them. */
const received = vi.hoisted(() => ({ props: {} as Record<string, unknown> }));

vi.mock("heroui-native-pro/wheel-picker-group", async () => {
  const { createElement } = await import("react");
  const part = () => (props: Record<string, unknown>) =>
    createElement("div", null, props["children"] as ReactNode);
  const root = (props: Record<string, unknown>) => {
    received.props = props;
    return createElement("div", null, props["children"] as ReactNode);
  };
  return {
    WheelPickerGroup: Object.assign(root, {
      Indicator: part(),
      IndicatorBackground: part(),
      Mask: part(),
    }),
    useWheelPickerGroup: () => undefined,
  };
});

describe("WheelPickerGroup (native)", () => {
  beforeEach(() => {
    received.props = {};
  });

  it("hands HeroUI Native Pro isDisabled and maps label to the accessibility label", () => {
    render(<WheelPickerGroup isDisabled label="Field" />);
    expect(received.props).toMatchObject({ isDisabled: true, accessibilityLabel: "Field" });
  });

  it("leaves out the props the caller left out, so HeroUI Native Pro's defaults stay", () => {
    render(<WheelPickerGroup />);
    expect(received.props).not.toHaveProperty("isDisabled");
    expect(received.props).not.toHaveProperty("accessibilityLabel");
  });

  it("passes every other prop through unchanged", () => {
    const onValuesChange = vi.fn();
    render(
      <WheelPickerGroup
        itemHeight={40}
        visibleCount={3}
        onValuesChange={onValuesChange}
        testID="found"
      />,
    );
    expect(received.props).toMatchObject({
      itemHeight: 40,
      visibleCount: 3,
      onValuesChange,
      testID: "found",
    });
  });

  it.each(["Indicator", "IndicatorBackground", "Mask"] as const)(
    "exposes HeroUI Native Pro's own %s",
    (name) => {
      expect(WheelPickerGroup[name]).toBe(HeroWheelPickerGroup[name]);
    },
  );

  it("re-exports HeroUI Native Pro's own hook", () => {
    expect(useWheelPickerGroup).toBe(HeroUseWheelPickerGroup);
  });

  it("extends its contract and refuses the names the contract owns", () => {
    expectTypeOf<WheelPickerGroupProps>().toExtend<WheelPickerGroupContractProps>();
    expectTypeOf<WheelPickerGroupProps>().not.toHaveProperty("accessibilityLabel");
    expectTypeOf<WheelPickerGroupProps>().not.toHaveProperty("aria-label");
  });
});
