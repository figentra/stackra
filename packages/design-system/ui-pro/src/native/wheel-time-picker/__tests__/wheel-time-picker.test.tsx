/**
 * Stackra file contract:
 * Purpose: proves the native WheelTimePicker hands HeroUI Native Pro's WheelTimePicker `isDisabled` and the accessible name
 *          (`label` as `accessibilityLabel`), leaves out what the caller left out, passes every other prop through
 *          with HeroUI's own value type, and exposes HeroUI Native Pro's own five parts.
 * Boundary: React Native does not render in vitest, so the heroui-native-pro subpath is replaced by a recording
 *          stand-in that renders plain DOM; what reaches HeroUI Native Pro is checked, not its rendering.
 * Runtime: node
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-416:FR-009
import { Time } from "@internationalized/date";
import { render } from "@testing-library/react";
import { WheelTimePicker as HeroWheelTimePicker } from "heroui-native-pro/wheel-time-picker";
import type { ReactNode } from "react";

import type { DatePickerContractProps } from "#contracts/types/date-picker-contract-props.type";
import { WheelTimePicker } from "#native/wheel-time-picker/wheel-time-picker";
import type { WheelTimePickerProps } from "#native/wheel-time-picker/wheel-time-picker.props";

/** The props the root stand-in was last handed, as the real component would receive them. */
const received = vi.hoisted(() => ({ props: {} as Record<string, unknown> }));

vi.mock("heroui-native-pro/wheel-time-picker", async () => {
  const { createElement } = await import("react");
  const part = () => (props: Record<string, unknown>) =>
    createElement("div", null, props["children"] as ReactNode);
  const root = (props: Record<string, unknown>) => {
    received.props = props;
    return createElement("div", null, props["children"] as ReactNode);
  };
  return {
    WheelTimePicker: Object.assign(root, {
      Hour: part(),
      Minute: part(),
      Period: part(),
      Indicator: part(),
      Mask: part(),
    }),
  };
});

describe("WheelTimePicker (native)", () => {
  beforeEach(() => {
    received.props = {};
  });

  it("hands HeroUI Native Pro isDisabled and maps label to the accessibility label", () => {
    render(<WheelTimePicker isDisabled label="WheelTimePicker label" />);
    expect(received.props).toMatchObject({
      isDisabled: true,
      accessibilityLabel: "WheelTimePicker label",
    });
  });

  it("leaves out the props the caller left out, so HeroUI Native Pro's defaults stay", () => {
    render(<WheelTimePicker />);
    expect(received.props).not.toHaveProperty("isDisabled");
    expect(received.props).not.toHaveProperty("accessibilityLabel");
  });

  it("passes every other prop through unchanged", () => {
    const onValueChange = vi.fn();
    const value = new Time(9, 30);
    render(
      <WheelTimePicker
        value={value}
        onValueChange={onValueChange}
        hourFormat={24}
        minuteInterval={5}
        locale="ar"
        testID="found"
      />,
    );
    expect(received.props).toMatchObject({
      value,
      onValueChange,
      hourFormat: 24,
      minuteInterval: 5,
      locale: "ar",
      testID: "found",
    });
  });

  it.each(["Hour", "Minute", "Period", "Indicator", "Mask"] as const)(
    "exposes HeroUI Native Pro's own %s",
    (name) => {
      expect(WheelTimePicker[name]).toBe(HeroWheelTimePicker[name]);
    },
  );

  it("extends its contract and refuses the names the contract owns", () => {
    expectTypeOf<WheelTimePickerProps>().toExtend<DatePickerContractProps>();
    // @ts-expect-error the accessible name is `label`
    void (<WheelTimePicker accessibilityLabel="x" />);
  });
});
