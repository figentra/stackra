/**
 * Stackra file contract:
 * Purpose: proves the native WheelPicker hands HeroUI Native Pro's WheelPicker `isDisabled` and the accessible name (`label` as
 *          `accessibilityLabel`), leaves out what the caller left out, passes every other prop through
 *          (`items`, `value` and `visibleCount` among them), exposes HeroUI Native Pro's own parts and hooks, and refuses
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
  WheelPicker as HeroWheelPicker,
  useWheelPicker as HeroUseWheelPicker,
  useWheelPickerItem as HeroUseWheelPickerItem,
} from "heroui-native-pro/wheel-picker";
import type { ReactNode } from "react";

import type { WheelPickerContractProps } from "#contracts/types/wheel-picker-contract-props.type";
import { WheelPicker, useWheelPicker, useWheelPickerItem } from "#native/wheel-picker/wheel-picker";
import type { WheelPickerProps } from "#native/wheel-picker/wheel-picker.props";

/** The props the root stand-in was last handed, as the real component would receive them. */
const received = vi.hoisted(() => ({ props: {} as Record<string, unknown> }));

vi.mock("heroui-native-pro/wheel-picker", async () => {
  const { createElement } = await import("react");
  const part = () => (props: Record<string, unknown>) =>
    createElement("div", null, props["children"] as ReactNode);
  const root = (props: Record<string, unknown>) => {
    received.props = props;
    return createElement("div", null, props["children"] as ReactNode);
  };
  return {
    WheelPicker: Object.assign(root, {
      Item: part(),
      ItemLabel: part(),
      Indicator: part(),
      IndicatorBackground: part(),
      Mask: part(),
    }),
    useWheelPicker: () => undefined,
    useWheelPickerItem: () => undefined,
  };
});
const items = [{ value: 1, label: "One" }];

describe("WheelPicker (native)", () => {
  beforeEach(() => {
    received.props = {};
  });

  it("hands HeroUI Native Pro isDisabled and maps label to the accessibility label", () => {
    render(<WheelPicker items={items} isDisabled label="Field" />);
    expect(received.props).toMatchObject({ isDisabled: true, accessibilityLabel: "Field" });
  });

  it("leaves out the props the caller left out, so HeroUI Native Pro's defaults stay", () => {
    render(<WheelPicker items={items} />);
    expect(received.props).not.toHaveProperty("isDisabled");
    expect(received.props).not.toHaveProperty("accessibilityLabel");
  });

  it("passes every other prop through unchanged", () => {
    render(<WheelPicker items={items} value={1} visibleCount={3} testID="found" />);
    expect(received.props).toMatchObject({ items, value: 1, visibleCount: 3, testID: "found" });
  });

  it.each(["Item", "ItemLabel", "Indicator", "IndicatorBackground", "Mask"] as const)(
    "exposes HeroUI Native Pro's own %s",
    (name) => {
      expect(WheelPicker[name]).toBe(HeroWheelPicker[name]);
    },
  );

  it("re-exports HeroUI Native Pro's own hooks", () => {
    expect(useWheelPicker).toBe(HeroUseWheelPicker);
    expect(useWheelPickerItem).toBe(HeroUseWheelPickerItem);
  });

  it("extends its contract and refuses the names the contract owns", () => {
    expectTypeOf<WheelPickerProps>().toExtend<WheelPickerContractProps>();
    expectTypeOf<WheelPickerProps>().not.toHaveProperty("accessibilityLabel");
    expectTypeOf<WheelPickerProps>().not.toHaveProperty("aria-label");
  });
});
