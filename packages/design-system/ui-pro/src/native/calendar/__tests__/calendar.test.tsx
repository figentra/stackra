/**
 * Stackra file contract:
 * Purpose: proves the native Calendar hands HeroUI Native Pro's Calendar `isDisabled` and the accessible name
 *          (`label` as `accessibilityLabel`), leaves out what the caller left out, passes every other prop through
 *          with its `@internationalized/date` values, and exposes HeroUI Native Pro's own eighteen parts.
 * Boundary: React Native does not render in vitest, so the heroui-native-pro subpath is replaced by a recording
 *          stand-in that renders plain DOM; what reaches HeroUI Native Pro is checked, not its rendering.
 * Runtime: node
 * Governing contract: ADR 0310 (decision 4); ADR 0303 (decision 7); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-403:FR-011
import { CalendarDate } from "@internationalized/date";
import { render } from "@testing-library/react";
import { Calendar as HeroCalendar } from "heroui-native-pro/calendar";
import type { ReactNode } from "react";

import type { CalendarContractProps } from "#contracts/types/calendar-contract-props.type";
import { Calendar, type CalendarProps } from "#native/calendar/calendar";

/** The props the root stand-in was last handed, and the part names the stand-in carries. */
const received = vi.hoisted(() => ({
  props: {} as Record<string, unknown>,
  parts: [
    "Header",
    "Heading",
    "NavButton",
    "Grid",
    "GridHeader",
    "GridBody",
    "HeaderCell",
    "HeaderCellLabel",
    "Cell",
    "CellBody",
    "CellLabel",
    "CellIndicator",
    "YearPickerTrigger",
    "YearPickerTriggerHeading",
    "YearPickerTriggerIndicator",
    "YearPickerGrid",
    "YearPickerGridBody",
    "YearPickerCell",
  ] as const,
}));

vi.mock("heroui-native-pro/calendar", async () => {
  const { createElement } = await import("react");
  const part = () => (props: Record<string, unknown>) =>
    createElement("div", null, props["children"] as ReactNode);
  const root = (props: Record<string, unknown>) => {
    received.props = props;
    return createElement("div", null, props["children"] as ReactNode);
  };
  return {
    Calendar: Object.assign(root, Object.fromEntries(received.parts.map((name) => [name, part()]))),
  };
});

describe("Calendar (native)", () => {
  beforeEach(() => {
    received.props = {};
  });

  it("hands HeroUI Native Pro isDisabled and maps label to the accessibility label", () => {
    render(<Calendar isDisabled label="Pick a delivery date" />);
    expect(received.props).toMatchObject({
      isDisabled: true,
      accessibilityLabel: "Pick a delivery date",
    });
  });

  it("leaves out the props the caller left out, so HeroUI Native Pro's defaults stay", () => {
    render(<Calendar />);
    expect(received.props).not.toHaveProperty("isDisabled");
    expect(received.props).not.toHaveProperty("accessibilityLabel");
  });

  it("passes every other prop through unchanged, dates included", () => {
    const onChange = vi.fn();
    const value = new CalendarDate(2026, 6, 15);
    const minValue = new CalendarDate(2026, 6, 1);
    render(
      <Calendar
        value={value}
        minValue={minValue}
        firstDayOfWeek="mon"
        isReadOnly
        onChange={onChange}
        testID="found"
      />,
    );
    expect(received.props).toMatchObject({
      value,
      minValue,
      firstDayOfWeek: "mon",
      isReadOnly: true,
      onChange,
      testID: "found",
    });
    expect(received.props["value"]).toBe(value);
  });

  it.each(received.parts)("exposes HeroUI Native Pro's own %s", (name) => {
    expect(Calendar[name]).toBe(HeroCalendar[name]);
  });

  it("extends its contract and refuses the names the contract owns", () => {
    expectTypeOf<CalendarProps>().toExtend<CalendarContractProps>();
    // @ts-expect-error the accessible name is `label`
    void (<Calendar accessibilityLabel="x" />);
  });
});
