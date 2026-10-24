/**
 * Stackra file contract:
 * Purpose: proves the native TimePicker hands HeroUI Native Pro's TimePicker `isDisabled` and the accessible name
 *          (`label` as `accessibilityLabel`), leaves out what the caller left out, passes every other prop through
 *          with HeroUI's own value type, and exposes HeroUI Native Pro's own thirteen parts.
 * Boundary: React Native does not render in vitest, so the heroui-native-pro subpath is replaced by a recording
 *          stand-in that renders plain DOM; what reaches HeroUI Native Pro is checked, not its rendering.
 * Runtime: node
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-416:FR-009
import { render } from "@testing-library/react";
import { TimePicker as HeroTimePicker } from "heroui-native-pro/time-picker";
import type { ReactNode } from "react";

import type { DatePickerContractProps } from "#contracts/types/date-picker-contract-props.type";
import { TimePicker, type TimePickerProps } from "#native/time-picker/time-picker";

/** The props the root stand-in was last handed, as the real component would receive them. */
const received = vi.hoisted(() => ({ props: {} as Record<string, unknown> }));

vi.mock("heroui-native-pro/time-picker", async () => {
  const { createElement } = await import("react");
  const part = () => (props: Record<string, unknown>) =>
    createElement("div", null, props["children"] as ReactNode);
  const root = (props: Record<string, unknown>) => {
    received.props = props;
    return createElement("div", null, props["children"] as ReactNode);
  };
  return {
    TimePicker: Object.assign(root, {
      Select: part(),
      Portal: part(),
      Overlay: part(),
      Content: part(),
      Trigger: part(),
      Value: part(),
      TriggerIndicator: part(),
      Wheel: part(),
      WheelHour: part(),
      WheelMinute: part(),
      WheelPeriod: part(),
      WheelIndicator: part(),
      WheelMask: part(),
    }),
  };
});

describe("TimePicker (native)", () => {
  beforeEach(() => {
    received.props = {};
  });

  it("hands HeroUI Native Pro isDisabled and maps label to the accessibility label", () => {
    render(<TimePicker isDisabled label="TimePicker label" />);
    expect(received.props).toMatchObject({
      isDisabled: true,
      accessibilityLabel: "TimePicker label",
    });
  });

  it("leaves out the props the caller left out, so HeroUI Native Pro's defaults stay", () => {
    render(<TimePicker />);
    expect(received.props).not.toHaveProperty("isDisabled");
    expect(received.props).not.toHaveProperty("accessibilityLabel");
  });

  it("passes every other prop through unchanged", () => {
    const onValueChange = vi.fn();
    const value = { value: "09:30", label: "9:30 AM" };
    render(
      <TimePicker
        value={value}
        onValueChange={onValueChange}
        hourFormat={24}
        minuteInterval={5}
        isInvalid
        testID="found"
      />,
    );
    expect(received.props).toMatchObject({
      value,
      onValueChange,
      hourFormat: 24,
      minuteInterval: 5,
      isInvalid: true,
      testID: "found",
    });
  });

  it.each([
    "Select",
    "Portal",
    "Overlay",
    "Content",
    "Trigger",
    "Value",
    "TriggerIndicator",
    "Wheel",
    "WheelHour",
    "WheelMinute",
    "WheelPeriod",
    "WheelIndicator",
    "WheelMask",
  ] as const)("exposes HeroUI Native Pro's own %s", (name) => {
    expect(TimePicker[name]).toBe(HeroTimePicker[name]);
  });

  it("extends its contract and refuses the names the contract owns", () => {
    expectTypeOf<TimePickerProps>().toExtend<DatePickerContractProps>();
    // @ts-expect-error the accessible name is `label`
    void (<TimePicker accessibilityLabel="x" />);
  });
});
