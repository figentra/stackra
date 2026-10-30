/**
 * Stackra file contract:
 * Purpose: proves the native `PeriodPicker` wires its parts as the web one does: the preset Select on the last 30 days
 *          with "Custom range" last; a preset hands on its range; "Custom range" adds the DateRangePicker; the compare
 *          Switch adds the previous period, its description reads the range, and the mode Select turns it into last
 *          year's.
 * Boundary: React Native and HeroUI Native do not render in vitest, so the Select, Switch and DateRangePicker are
 *           recording stand-ins; what reaches them is checked.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); ADR 0307 (decision 17); ADR 0022 (test placement); STA-1371.
 */
// @vitest-environment jsdom
import { CalendarDate } from "@internationalized/date";
import { act, render } from "@testing-library/react";
import type { ReactNode } from "react";

import type { PeriodValue } from "#contracts/types/period-value.type";
import { PeriodPicker } from "#native/period-picker/period-picker";

const { state, recorder } = vi.hoisted(() => {
  const recorded = { props: {} as Record<string, Record<string, unknown>> };
  /** A stand-in that records its props under `name` (the mode Select under `mode`). */
  const record = (name: string) => (props: Record<string, unknown>) => {
    recorded.props[props["label"] === "Compare with" ? "mode" : name] = props;
    return null;
  };
  return { state: recorded, recorder: record };
});

vi.mock("react-native", async () => {
  const { createElement } = await import("react");
  return { View: (props: { children?: ReactNode }) => createElement("div", null, props.children) };
});
vi.mock("#native/design-system-provider/use-design-system", () => ({
  useDesignSystem: () => ({ locale: "en-US" }),
}));
vi.mock("#native/select/select", () => ({ Select: recorder("select") }));
vi.mock("#native/switch/switch", () => ({ Switch: recorder("switch") }));
vi.mock("#native/date-range-picker/date-range-picker", () => ({
  DateRangePicker: recorder("dates"),
}));

const TODAY = new CalendarDate(2026, 10, 29);
const part = (name: string) => state.props[name] ?? {};
const call = (name: string, value: unknown) =>
  act(() => (part(name)["onChange"] as (next: unknown) => void)(value));

describe("PeriodPicker (native)", () => {
  beforeEach(() => {
    state.props = {};
  });

  it("starts on the last 30 days with Custom range offered last", () => {
    render(<PeriodPicker today={TODAY} />);
    expect(part("select")["value"]).toBe("last_30_days");
    const items = part("select")["items"] as { id: string }[];
    expect(items.at(-1)?.id).toBe("custom");
    expect(part("dates")["onChange"]).toBeUndefined();
  });

  it("hands on a preset's range and shows the dates for a custom one", () => {
    const onChange = vi.fn<(value: PeriodValue) => void>();
    render(<PeriodPicker today={TODAY} onChange={onChange} />);
    call("select", "last_quarter");
    expect(onChange.mock.lastCall?.[0].range.start?.toString()).toBe("2026-07-01");
    call("select", "custom");
    expect(part("dates")["label"]).toBe("Dates");
  });

  it("compares with the previous period, then last year", () => {
    const onChange = vi.fn<(value: PeriodValue) => void>();
    render(<PeriodPicker today={TODAY} onChange={onChange} />);
    call("switch", true);
    expect(onChange.mock.lastCall?.[0].compare?.range.end?.toString()).toBe("2026-09-29");
    expect(String(part("switch")["description"])).toMatch(/^vs /);
    call("mode", "year");
    expect(onChange.mock.lastCall?.[0].compare?.range.start?.toString()).toBe("2025-09-30");
  });
});
