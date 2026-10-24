/**
 * Stackra file contract:
 * Purpose: proves the native RangeCalendar hands HeroUI Native Pro's RangeCalendar `isDisabled` and the accessible name
 *          (`label` as `accessibilityLabel`), leaves out what the caller left out, passes every other prop through
 *          with HeroUI's own value type, and exposes HeroUI Native Pro's own eighteen parts.
 * Boundary: React Native does not render in vitest, so the heroui-native-pro subpath is replaced by a recording
 *          stand-in that renders plain DOM; what reaches HeroUI Native Pro is checked, not its rendering.
 * Runtime: node
 * Governing contract: ADR 0310 (decision 3); ADR 0303 (decision 7); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-416:FR-009
import { CalendarDate } from "@internationalized/date";
import { render } from "@testing-library/react";
import { RangeCalendar as HeroRangeCalendar } from "heroui-native-pro/range-calendar";
import type { ReactNode } from "react";

import type { CalendarContractProps } from "#contracts/types/calendar-contract-props.type";
import { RangeCalendar, type RangeCalendarProps } from "#native/range-calendar/range-calendar";

/** The props the root stand-in was last handed, as the real component would receive them. */
const received = vi.hoisted(() => ({ props: {} as Record<string, unknown> }));

vi.mock("heroui-native-pro/range-calendar", async () => {
  const { createElement } = await import("react");
  const part = () => (props: Record<string, unknown>) =>
    createElement("div", null, props["children"] as ReactNode);
  const root = (props: Record<string, unknown>) => {
    received.props = props;
    return createElement("div", null, props["children"] as ReactNode);
  };
  return {
    RangeCalendar: Object.assign(root, {
      Header: part(),
      Heading: part(),
      NavButton: part(),
      Grid: part(),
      GridHeader: part(),
      GridBody: part(),
      HeaderCell: part(),
      HeaderCellLabel: part(),
      Cell: part(),
      CellBody: part(),
      CellLabel: part(),
      CellIndicator: part(),
      YearPickerTrigger: part(),
      YearPickerTriggerHeading: part(),
      YearPickerTriggerIndicator: part(),
      YearPickerGrid: part(),
      YearPickerGridBody: part(),
      YearPickerCell: part(),
    }),
  };
});

describe("RangeCalendar (native)", () => {
  beforeEach(() => {
    received.props = {};
  });

  it("hands HeroUI Native Pro isDisabled and maps label to the accessibility label", () => {
    render(<RangeCalendar isDisabled label="RangeCalendar label" />);
    expect(received.props).toMatchObject({
      isDisabled: true,
      accessibilityLabel: "RangeCalendar label",
    });
  });

  it("leaves out the props the caller left out, so HeroUI Native Pro's defaults stay", () => {
    render(<RangeCalendar />);
    expect(received.props).not.toHaveProperty("isDisabled");
    expect(received.props).not.toHaveProperty("accessibilityLabel");
  });

  it("passes every other prop through unchanged", () => {
    const onChange = vi.fn();
    const value = { start: new CalendarDate(2026, 6, 15), end: new CalendarDate(2026, 6, 20) };
    render(
      <RangeCalendar
        value={value}
        onChange={onChange}
        minValue={new CalendarDate(2026, 1, 1)}
        maxValue={new CalendarDate(2026, 12, 31)}
        locale="ar"
        testID="found"
      />,
    );
    expect(received.props).toMatchObject({
      value,
      onChange,
      locale: "ar",
      testID: "found",
    });
  });

  it.each([
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
  ] as const)("exposes HeroUI Native Pro's own %s", (name) => {
    expect(RangeCalendar[name]).toBe(HeroRangeCalendar[name]);
  });

  it("extends its contract and refuses the names the contract owns", () => {
    expectTypeOf<RangeCalendarProps>().toExtend<CalendarContractProps>();
    // @ts-expect-error the accessible name is `label`
    void (<RangeCalendar accessibilityLabel="x" />);
  });
});
