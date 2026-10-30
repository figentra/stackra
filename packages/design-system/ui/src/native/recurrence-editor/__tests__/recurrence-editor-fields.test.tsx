/**
 * Stackra file contract:
 * Purpose: proves the native RecurrenceEditor's remaining controls write the rule: the interval (1 drops it), a weekly
 *          rule never loses its last day, the end choice (until, count, never), the occurrence count and the end
 *          date; the group carries the caller's label and class and passes `isDisabled` to every field.
 * Boundary: React Native and the house fields do not run in vitest, so they are replaced by recording stand-ins; their
 *           callbacks are called as the fields would.
 * Runtime: node
 * Governing contract: RFC 5545 section 3.3.10; ADR 0302 (decision 3); ADR 0022 (test placement); STA-1371.
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
      return state.h?.("div", { "data-name": name }, props["children"]);
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
  useDesignSystem: () => ({ locale: "en-US" }),
}));

/** The last props a stand-in was handed that match `where`. */
const last = (
  name: string,
  where: (props: Record<string, unknown>) => boolean = () => true,
): Record<string, unknown> => [...(seen.props[name] ?? [])].reverse().find(where) ?? {};

/** The "how it ends" radio group. */
const ends = (): Record<string, unknown> =>
  last("RadioGroup", (props) =>
    (props["options"] as { value: string }[]).some((option) => option.value === "never"),
  );

/** The "repeat every" interval field. */
const interval = (): Record<string, unknown> =>
  last("NumberField", (props) => props["maxValue"] === 999);

/** The occurrence count field. */
const count = (): Record<string, unknown> =>
  last("NumberField", (props) => props["maxValue"] === 9999);

/** Calls a stand-in's `onChange` with `value`. */
const change = (props: Record<string, unknown>, value: unknown): void =>
  act(() => (props["onChange"] as (next: unknown) => void)(value));

const START = new CalendarDate(2026, 10, 13);

describe("RecurrenceEditor fields (native)", () => {
  beforeEach(() => {
    seen.props = {};
  });

  it("writes the interval, dropping it at one or when cleared", () => {
    const changes: string[] = [];
    render(
      <RecurrenceEditor
        startDate={START}
        defaultValue="FREQ=DAILY"
        onChange={(value) => changes.push(value)}
      />,
    );
    change(interval(), 3);
    expect(changes.at(-1)).toBe("FREQ=DAILY;INTERVAL=3");
    expect(interval()["value"]).toBe(3);
    change(interval(), 1);
    expect(changes.at(-1)).toBe("FREQ=DAILY");
    change(interval(), 4);
    change(interval(), null);
    expect(changes.at(-1)).toBe("FREQ=DAILY");
  });

  it("keeps at least one weekday picked and ignores an emptied frequency", () => {
    const onChange = vi.fn();
    render(
      <RecurrenceEditor
        startDate={START}
        defaultValue="FREQ=WEEKLY;BYDAY=TU"
        onChange={onChange}
      />,
    );
    act(() =>
      (last("ToggleButtonGroup")["onSelectionChange"] as (keys: Set<string>) => void)(new Set()),
    );
    change(last("Select"), null);
    expect(onChange).not.toHaveBeenCalled();
    expect(last("ToggleButtonGroup")["selectedKeys"]).toEqual(["TU"]);
  });

  it("ends after a count, on a date, or never", () => {
    const changes: string[] = [];
    render(
      <RecurrenceEditor
        startDate={START}
        defaultValue="FREQ=DAILY"
        onChange={(value) => changes.push(value)}
      />,
    );
    expect(seen.props["DatePicker"]).toBeUndefined();

    change(ends(), "count");
    expect(changes.at(-1)).toMatch(/^FREQ=DAILY;COUNT=\d+$/u);
    change(count(), 12);
    expect(changes.at(-1)).toBe("FREQ=DAILY;COUNT=12");
    const before = changes.length;
    change(count(), 0);
    change(count(), null);
    expect(changes).toHaveLength(before);

    change(ends(), "until");
    expect(changes.at(-1)).toMatch(/^FREQ=DAILY;UNTIL=\d{8}$/u);
    expect(last("DatePicker")["minValue"]).toEqual(START);
    change(last("DatePicker"), new CalendarDate(2027, 3, 1));
    expect(changes.at(-1)).toBe("FREQ=DAILY;UNTIL=20270301");
    const afterDate = changes.length;
    change(last("DatePicker"), null);
    expect(changes).toHaveLength(afterDate);

    change(ends(), "never");
    expect(changes.at(-1)).toBe("FREQ=DAILY");
  });

  it("names the group by its label, keeps its class and disables every field", () => {
    render(
      <RecurrenceEditor
        startDate={START}
        label="Repeats"
        className="mt-2"
        isDisabled
        defaultValue="FREQ=MONTHLY;BYMONTHDAY=13;COUNT=3"
      />,
    );
    expect(seen.props["View"]?.[0]).toMatchObject({ accessibilityLabel: "Repeats" });
    expect(String(seen.props["View"]?.[0]?.["className"])).toContain("mt-2");
    for (const name of ["NumberField", "Select", "RadioGroup"]) {
      for (const props of seen.props[name] ?? []) expect(props["isDisabled"]).toBe(true);
    }
  });
});
