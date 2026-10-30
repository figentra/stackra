/**
 * Stackra file contract:
 * Purpose: proves the native RecurrenceEditor hands its controls the rule: weekly toggles in the locale's week order
 *          named by the full weekday, frequency changes and the monthly nth weekday written as RRULE text, the end
 *          date's picker in the Hijri calendar for a Hijri rule, and the sentence in a polite live region.
 * Boundary: React Native and the house fields do not run in vitest, so they are replaced by recording stand-ins; their
 *           callbacks are called as the fields would.
 * Runtime: node
 * Governing contract: RFC 5545; RFC 7529; ADR 0302 (decision 3); ADR 0022 (test placement); STA-1371.
 */
// @vitest-environment jsdom
import { CalendarDate } from "@internationalized/date";
import { act, render } from "@testing-library/react";

import { RecurrenceEditor } from "#native/recurrence-editor/recurrence-editor";

/** What each stand-in was handed, by name, and the stand-in maker. */
const seen = vi.hoisted(() => {
  const state = {
    props: {} as Record<string, Record<string, unknown>[]>,
    h: undefined as undefined | ((...args: unknown[]) => unknown),
    /** A stand-in that records its props and renders its children. */
    rec: (name: string) => (props: Record<string, unknown>) => {
      state.props[name] = [...(state.props[name] ?? []), props];
      return state.h?.(
        "div",
        { "data-name": name, "aria-live": props["accessibilityLiveRegion"] },
        props["children"],
      );
    },
  };
  return state;
});

vi.mock("react-native", async () => {
  seen.h = (await import("react")).createElement as never;
  return { View: seen.rec("View") };
});
vi.mock("#native/text/text", () => ({ Text: seen.rec("Text") }));
vi.mock("#native/number-field/number-field", () => ({ NumberField: seen.rec("NumberField") }));
vi.mock("#native/select/select", () => ({ Select: seen.rec("Select") }));
vi.mock("#native/radio-group/radio-group", () => ({ RadioGroup: seen.rec("RadioGroup") }));
vi.mock("#native/date-picker/date-picker", () => ({ DatePicker: seen.rec("DatePicker") }));
vi.mock("#native/toggle-button/toggle-button", () => ({
  ToggleButton: seen.rec("ToggleButton"),
}));
vi.mock("#native/toggle-button-group/toggle-button-group", () => ({
  ToggleButtonGroup: seen.rec("ToggleButtonGroup"),
}));
vi.mock("#native/design-system-provider/use-design-system", () => ({
  useDesignSystem: () => ({ locale: "ar-SA" }),
}));

/** The last props a stand-in was handed. */
const last = (name: string): Record<string, unknown> => seen.props[name]?.at(-1) ?? {};

/** 2026-10-13, the second Tuesday of October. */
const START = new CalendarDate(2026, 10, 13);

describe("RecurrenceEditor (native)", () => {
  beforeEach(() => {
    seen.props = {};
  });

  it("toggles weekdays in the locale's week order and changes frequency", () => {
    const changes: string[] = [];
    render(<RecurrenceEditor startDate={START} onChange={(value) => changes.push(value)} />);
    const days = (seen.props["ToggleButton"] ?? []).slice(0, 7).map((props) => props["id"]);
    expect(days[0]).toBe("SU");
    expect(seen.props["ToggleButton"]?.[0]?.["label"]).toBe("الأحد");
    // The unit is named for assistive technology only, so "Repeat every" shows once, over the number.
    expect(last("Select")["label"]).toBeUndefined();
    expect(last("Select")["accessibilityLabel"]).toBe(last("NumberField")["label"]);
    act(() =>
      (last("ToggleButtonGroup")["onSelectionChange"] as (keys: Set<string>) => void)(
        new Set(["TU", "SU"]),
      ),
    );
    expect(changes.at(-1)).toBe("FREQ=WEEKLY;BYDAY=SU,TU");
    act(() => (last("Select")["onChange"] as (value: string) => void)("monthly"));
    expect(changes.at(-1)).toBe("FREQ=MONTHLY;BYMONTHDAY=13");
  });

  it("writes the nth weekday and shows a Hijri rule's end date in the Hijri calendar", () => {
    const changes: string[] = [];
    render(
      <RecurrenceEditor
        startDate={START}
        defaultValue="RSCALE=ISLAMIC-UMALQURA;FREQ=MONTHLY;BYMONTHDAY=1;UNTIL=20270101"
        onChange={(value) => changes.push(value)}
      />,
    );
    expect(last("DatePicker")["calendar"]).toBe("islamic-umalqura");
    const monthly = seen.props["RadioGroup"]?.find((props) =>
      (props["options"] as { value: string }[]).some((option) => option.value === "nth"),
    );
    const onMonthly = monthly?.["onChange"] as ((value: string) => void) | undefined;
    act(() => onMonthly?.("nth"));
    expect(changes.at(-1)).toMatch(
      /^RSCALE=ISLAMIC-UMALQURA;FREQ=MONTHLY;BYDAY=-?\d[A-Z]{2};UNTIL=20270101$/u,
    );
    // No I18nProvider: the words are the English catalogue's, the weekday Intl's in the locale.
    expect(document.querySelector("[aria-live=polite]")?.textContent).toContain(
      "in the Hijri calendar",
    );
  });
});
