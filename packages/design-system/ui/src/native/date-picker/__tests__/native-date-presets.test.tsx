/**
 * Stackra file contract:
 * Purpose: proves the native DatePicker's presets and Hijri line: with presets the field runs controlled and a row of
 *          preset buttons (named by the catalogue) each sets the day from `today` with a selection haptic, marking
 *          the chosen one; the owner's value is followed; in the Hijri calendar the chosen day is written under the
 *          field in that calendar, and nothing is written before a day is chosen.
 * Boundary: React Native does not render in vitest, so it and the house DateInput, Text and haptics are recording
 *           stand-ins that render plain DOM; the platform picker is the DateInput's and is proved there.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); ADR 0192 (decision 3); WCAG 2.2 SC 4.1.2; ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { CalendarDate } from "@internationalized/date";
import { act, fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

import type { DesignSystemState } from "#contracts/types/design-system-state.type";
import { DatePicker } from "#native/date-picker/date-picker";
import type { DatePickerProps } from "#native/date-picker/date-picker.props";
import { DesignSystemContext } from "#native/design-system-provider/design-system-context";

const state = vi.hoisted(() => ({
  input: {} as Record<string, unknown>,
  views: [] as Record<string, unknown>[],
  buttons: [] as Record<string, unknown>[],
  played: [] as string[],
}));

vi.mock("react-native", async () => {
  const { createElement } = await import("react");
  return {
    View: (props: Record<string, unknown>) => {
      state.views.push(props);
      return createElement("div", null, props["children"] as ReactNode);
    },
    Pressable: (props: Record<string, unknown>) => {
      state.buttons.push(props);
      return createElement(
        "button",
        { type: "button", onClick: props["onPress"] as () => void },
        props["children"] as ReactNode,
      );
    },
  };
});
vi.mock("#native/text/text", async () => {
  const { createElement } = await import("react");
  return {
    Text: (props: Record<string, unknown>) =>
      createElement("span", null, props["children"] as ReactNode),
  };
});
vi.mock("#native/date-field/date-input", () => ({
  DateInput: (props: Record<string, unknown>) => {
    state.input = props;
    return null;
  },
}));
vi.mock("#native/haptics/haptics", () => ({
  haptics: { play: (kind: string) => state.played.push(kind) },
}));
vi.mock("#react/hooks/use-ui-text", () => ({ useUiText: () => (key: string) => key }));

const TODAY = new CalendarDate(2026, 10, 15);
const within = (props: Partial<DatePickerProps>) =>
  render(
    <DesignSystemContext value={{ locale: "en-US", direction: "ltr" } as DesignSystemState}>
      <DatePicker label="Due" {...props} />
    </DesignSystemContext>,
  );
const selected = () =>
  state.buttons
    .slice(-2)
    .map((button) => (button["accessibilityState"] as { selected: boolean }).selected);

beforeEach(() => {
  state.input = {};
  state.views.length = 0;
  state.buttons.length = 0;
  state.played.length = 0;
});

describe("DatePicker presets (native)", () => {
  it("hands the field the catalogue's calendar button with no presets", () => {
    within({});
    expect(state.input).toMatchObject({
      label: "Due",
      calendarButtonLabel: "ui::date_picker.calendar",
    });
    expect(state.buttons).toHaveLength(0);
  });

  it("sets the day from a preset with a haptic and marks it", () => {
    const onChange = vi.fn();
    within({ presets: ["today", "tomorrow"], today: TODAY, onChange, calendarButtonLabel: "Cal" });
    expect(state.views.find((view) => view["accessibilityLabel"])).toMatchObject({
      accessibilityLabel: "ui::date_presets.label",
    });
    expect(state.input).toMatchObject({ value: null, calendarButtonLabel: "Cal" });
    expect(selected()).toEqual([false, false]);
    fireEvent.click(screen.getByText("ui::date_presets.tomorrow"));
    expect(onChange).toHaveBeenCalledWith(new CalendarDate(2026, 10, 16));
    expect(state.played).toEqual(["selection"]);
    expect(state.input["value"]).toEqual(new CalendarDate(2026, 10, 16));
    expect(selected()).toEqual([false, true]);
    act(() => (state.input["onChange"] as (day: CalendarDate | null) => void)(null));
    expect(onChange).toHaveBeenLastCalledWith(null);
  });

  it("follows the owner's day with presets, from the real today by default", () => {
    within({ presets: ["today"], value: TODAY, defaultValue: null });
    expect(state.input["value"]).toEqual(TODAY);
    fireEvent.click(screen.getByText("ui::date_presets.today"));
    expect(state.input["value"]).toEqual(TODAY);
  });

  it("writes the chosen day under the field in the Hijri calendar", () => {
    const onChange = vi.fn();
    within({ calendar: "islamic-umalqura", onChange });
    expect(screen.queryByText(/\d/)).toBeNull();
    act(() => (state.input["onChange"] as (day: CalendarDate) => void)(TODAY));
    expect(onChange).toHaveBeenCalledWith(TODAY);
    expect(screen.getByText(/1448/)).toBeTruthy();
  });

  it("writes the owner's Hijri day", () => {
    within({ calendar: "islamic-umalqura", value: TODAY });
    expect(screen.getByText(/1448/)).toBeTruthy();
  });
});
