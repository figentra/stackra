/**
 * Stackra file contract:
 * Purpose: proves the native DatePicker hands HeroUI Native Pro's DatePicker `isDisabled` and the accessible name
 *          (`label` as `accessibilityLabel`), leaves out what the caller left out, passes every other prop through
 *          with HeroUI's own `DatePickerOption` value, and exposes HeroUI Native Pro's own eight parts.
 * Boundary: React Native does not render in vitest, so the heroui-native-pro subpath is replaced by a recording
 *          stand-in that renders plain DOM; what reaches HeroUI Native Pro is checked, not its rendering.
 * Runtime: node
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-403:FR-011
import { render } from "@testing-library/react";
import { DatePicker as HeroDatePicker } from "heroui-native-pro/date-picker";
import type { ReactNode } from "react";

import type { DatePickerContractProps } from "#contracts/types/date-picker-contract-props.type";
import { DatePicker, type DatePickerProps } from "#native/date-picker/date-picker";

/** The props the root stand-in was last handed, as the real component would receive them. */
const received = vi.hoisted(() => ({ props: {} as Record<string, unknown> }));

vi.mock("heroui-native-pro/date-picker", async () => {
  const { createElement } = await import("react");
  const part = () => (props: Record<string, unknown>) =>
    createElement("div", null, props["children"] as ReactNode);
  const root = (props: Record<string, unknown>) => {
    received.props = props;
    return createElement("div", null, props["children"] as ReactNode);
  };
  return {
    DatePicker: Object.assign(root, {
      Select: part(),
      Portal: part(),
      Overlay: part(),
      Content: part(),
      Calendar: part(),
      Trigger: part(),
      Value: part(),
      TriggerIndicator: part(),
    }),
  };
});

describe("DatePicker (native)", () => {
  beforeEach(() => {
    received.props = {};
  });

  it("hands HeroUI Native Pro isDisabled and maps label to the accessibility label", () => {
    render(<DatePicker isDisabled label="Event date" />);
    expect(received.props).toMatchObject({ isDisabled: true, accessibilityLabel: "Event date" });
  });

  it("leaves out the props the caller left out, so HeroUI Native Pro's defaults stay", () => {
    render(<DatePicker />);
    expect(received.props).not.toHaveProperty("isDisabled");
    expect(received.props).not.toHaveProperty("accessibilityLabel");
  });

  it("passes every other prop through unchanged", () => {
    const onValueChange = vi.fn();
    const value = { value: "2026-06-15", label: "Jun 15, 2026" };
    render(
      <DatePicker
        value={value}
        onValueChange={onValueChange}
        dateDisplayFormat="long"
        locale="ar"
        isInvalid
        testID="found"
      />,
    );
    expect(received.props).toMatchObject({
      value,
      onValueChange,
      dateDisplayFormat: "long",
      locale: "ar",
      isInvalid: true,
      testID: "found",
    });
  });

  it.each([
    "Select",
    "Portal",
    "Overlay",
    "Content",
    "Calendar",
    "Trigger",
    "Value",
    "TriggerIndicator",
  ] as const)("exposes HeroUI Native Pro's own %s", (name) => {
    expect(DatePicker[name]).toBe(HeroDatePicker[name]);
  });

  it("extends its contract and refuses the names the contract owns", () => {
    expectTypeOf<DatePickerProps>().toExtend<DatePickerContractProps>();
    // @ts-expect-error the accessible name is `label`
    void (<DatePicker accessibilityLabel="x" />);
  });
});
