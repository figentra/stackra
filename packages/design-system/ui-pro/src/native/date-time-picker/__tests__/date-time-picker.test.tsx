/**
 * Stackra file contract:
 * Purpose: proves the native DateTimePicker hands HeroUI Native Pro's DateTimePicker `isDisabled` and the accessible name
 *          (`label` as `accessibilityLabel`), leaves out what the caller left out, passes every other prop through
 *          with HeroUI's own value type, and exposes HeroUI Native Pro's own fourteen parts.
 * Boundary: React Native does not render in vitest, so the heroui-native-pro subpath is replaced by a recording
 *          stand-in that renders plain DOM; what reaches HeroUI Native Pro is checked, not its rendering.
 * Runtime: node
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-416:FR-009
import { render } from "@testing-library/react";
import { DateTimePicker as HeroDateTimePicker } from "heroui-native-pro/date-time-picker";
import type { ReactNode } from "react";

import type { DatePickerContractProps } from "#contracts/types/date-picker-contract-props.type";
import { DateTimePicker } from "#native/date-time-picker/date-time-picker";
import type { DateTimePickerProps } from "#native/date-time-picker/date-time-picker.props";

/** The props the root stand-in was last handed, as the real component would receive them. */
const received = vi.hoisted(() => ({ props: {} as Record<string, unknown> }));

vi.mock("heroui-native-pro/date-time-picker", async () => {
  const { createElement } = await import("react");
  const part = () => (props: Record<string, unknown>) =>
    createElement("div", null, props["children"] as ReactNode);
  const root = (props: Record<string, unknown>) => {
    received.props = props;
    return createElement("div", null, props["children"] as ReactNode);
  };
  return {
    DateTimePicker: Object.assign(root, {
      Select: part(),
      Portal: part(),
      Overlay: part(),
      Content: part(),
      Trigger: part(),
      Value: part(),
      TriggerIndicator: part(),
      Wheel: part(),
      WheelDate: part(),
      WheelHour: part(),
      WheelMinute: part(),
      WheelPeriod: part(),
      WheelIndicator: part(),
      WheelMask: part(),
    }),
  };
});

describe("DateTimePicker (native)", () => {
  beforeEach(() => {
    received.props = {};
  });

  it("hands HeroUI Native Pro isDisabled and maps label to the accessibility label", () => {
    render(<DateTimePicker isDisabled label="DateTimePicker label" />);
    expect(received.props).toMatchObject({
      isDisabled: true,
      accessibilityLabel: "DateTimePicker label",
    });
  });

  it("leaves out the props the caller left out, so HeroUI Native Pro's defaults stay", () => {
    render(<DateTimePicker />);
    expect(received.props).not.toHaveProperty("isDisabled");
    expect(received.props).not.toHaveProperty("accessibilityLabel");
  });

  it("passes every other prop through unchanged", () => {
    const onValueChange = vi.fn();
    const value = { value: "2026-06-15T09:30", label: "Jun 15, 2026, 9:30 AM" };
    render(
      <DateTimePicker
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
    "WheelDate",
    "WheelHour",
    "WheelMinute",
    "WheelPeriod",
    "WheelIndicator",
    "WheelMask",
  ] as const)("exposes HeroUI Native Pro's own %s", (name) => {
    expect(DateTimePicker[name]).toBe(HeroDateTimePicker[name]);
  });

  it("extends its contract and refuses the names the contract owns", () => {
    expectTypeOf<DateTimePickerProps>().toExtend<DatePickerContractProps>();
    // @ts-expect-error the accessible name is `label`
    void (<DateTimePicker accessibilityLabel="x" />);
  });
});
