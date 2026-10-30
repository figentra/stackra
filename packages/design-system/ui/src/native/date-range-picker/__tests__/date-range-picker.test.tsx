/**
 * Stackra file contract:
 * Purpose: proves the native DateRangePicker: the field says the range in the locale (or nothing), a calendar button
 *          named by the catalogue unless given, a radiogroup of presets that each fill the calendar from `today`, and
 *          on done it reports a whole range (kept when uncontrolled) and ignores a half-picked one; opening drops the
 *          unsaved pick; no presets means no radiogroup.
 * Boundary: React Native does not render in vitest, so it and the house PickerField, RangeCalendar and Text are
 *           recording stand-ins that render plain DOM.
 * Runtime: node
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); ADR 0302 (decision 3); WCAG 2.2 SC
 *          4.1.2; ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { CalendarDate } from "@internationalized/date";
import { act, fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

import type { DesignSystemState } from "#contracts/types/design-system-state.type";
import { DateRangePicker } from "#native/date-range-picker/date-range-picker";
import type { DateRangePickerProps } from "#native/date-range-picker/date-range-picker.props";
import { DesignSystemContext } from "#native/design-system-provider/design-system-context";

const state = vi.hoisted(() => ({
  props: {} as Record<string, Record<string, unknown>>,
  views: [] as Record<string, unknown>[],
}));

vi.mock("react-native", async () => {
  const { createElement } = await import("react");
  return {
    View: (props: Record<string, unknown>) => {
      state.views.push(props);
      return createElement("div", null, props["children"] as ReactNode);
    },
    Pressable: (props: Record<string, unknown>) =>
      createElement(
        "button",
        { type: "button", onClick: props["onPress"] as () => void },
        props["children"] as ReactNode,
      ),
  };
});
vi.mock("#native/text/text", async () => {
  const { createElement } = await import("react");
  return {
    Text: (props: Record<string, unknown>) =>
      createElement("span", null, props["children"] as ReactNode),
  };
});
vi.mock("#native/time-field/picker-field", async () => {
  const { createElement } = await import("react");
  return {
    PickerField: (props: Record<string, unknown>) => {
      state.props["field"] = props;
      return createElement("div", null, props["children"] as ReactNode);
    },
  };
});
vi.mock("#native/range-calendar/range-calendar", () => ({
  RangeCalendar: (props: Record<string, unknown>) => {
    state.props["calendar"] = props;
    return null;
  },
}));
vi.mock("#react/hooks/use-ui-text", () => ({ useUiText: () => (key: string) => key }));

const TODAY = new CalendarDate(2026, 10, 15);
const within = (props: Partial<DateRangePickerProps> = {}) =>
  render(
    <DesignSystemContext value={{ locale: "en-US", direction: "ltr" } as DesignSystemState}>
      <DateRangePicker label="Period" today={TODAY} {...props} />
    </DesignSystemContext>,
  );
const propsOf = (name: string) => state.props[name] ?? {};
const done = () => act(() => (propsOf("field")["onDone"] as () => void)());
const openChange = (open: boolean) =>
  act(() => (propsOf("field")["onOpenChange"] as (next: boolean) => void)(open));
const pick = (range: unknown) =>
  act(() => (propsOf("calendar")["onChange"] as (next: unknown) => void)(range));

beforeEach(() => {
  state.props = {};
  state.views.length = 0;
});

describe("DateRangePicker (native)", () => {
  it("is empty with a calendar button and every preset", () => {
    within();
    expect(propsOf("field")).toMatchObject({
      label: "Period",
      text: "",
      icon: "calendar",
      buttonLabel: "ui::date_range_picker.calendar",
    });
    expect(state.views.find((view) => view["accessibilityRole"] === "radiogroup")).toMatchObject({
      accessibilityLabel: "ui::date_range_picker.presets",
    });
    expect(screen.getAllByRole("button")).toHaveLength(7);
    expect(propsOf("calendar")["value"]).toBeNull();
  });

  it("fills the calendar from a preset and reports it on done", () => {
    const onChange = vi.fn();
    within({ onChange });
    fireEvent.click(screen.getByText("ui::date_range_picker.last_7_days"));
    expect(propsOf("calendar")["value"]).toEqual({
      start: new CalendarDate(2026, 10, 9),
      end: TODAY,
    });
    done();
    expect(onChange).toHaveBeenCalledWith({ start: new CalendarDate(2026, 10, 9), end: TODAY });
    expect(propsOf("field")["text"]).toMatch(/Oct 9.*15, 2026/);
  });

  it("ignores a half range on done and drops the unsaved pick when opened again", () => {
    const onChange = vi.fn();
    const onOpenChange = vi.fn();
    within({
      onChange,
      onOpenChange,
      defaultValue: { start: TODAY, end: TODAY },
      calendarButtonLabel: "Cal",
      presets: [],
    });
    expect(propsOf("field")["buttonLabel"]).toBe("Cal");
    expect(state.views.some((view) => view["accessibilityRole"] === "radiogroup")).toBe(false);
    pick({ start: TODAY, end: null });
    done();
    expect(onChange).not.toHaveBeenCalled();
    openChange(true);
    expect(onOpenChange).toHaveBeenCalledWith(true);
    expect(propsOf("calendar")["value"]).toEqual({ start: TODAY, end: TODAY });
    openChange(false);
    done();
    expect(onChange).toHaveBeenCalledWith({ start: TODAY, end: TODAY });
  });

  it("shows the owner's range and keeps it after a pick", () => {
    const onChange = vi.fn();
    const range = { start: new CalendarDate(2026, 1, 1), end: new CalendarDate(2026, 1, 2) };
    within({ value: range, onChange, minValue: TODAY, maxValue: TODAY });
    expect(propsOf("calendar")).toMatchObject({ value: range, minValue: TODAY, maxValue: TODAY });
    pick({ start: TODAY, end: TODAY });
    done();
    expect(onChange).toHaveBeenCalledWith({ start: TODAY, end: TODAY });
    expect(propsOf("field")["text"]).toMatch(/Jan 1.*2, 2026/);
  });

  it("does nothing on done with no range at all", () => {
    const onChange = vi.fn();
    within({ value: null, onChange });
    done();
    expect(onChange).not.toHaveBeenCalled();
  });
});
