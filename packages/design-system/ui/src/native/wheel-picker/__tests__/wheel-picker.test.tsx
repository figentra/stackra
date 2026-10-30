/**
 * Stackra file contract:
 * Purpose: proves the native wheels: each column is one adjustable element named by its label that speaks the chosen
 *          row and steps past disabled rows on increment and decrement; a tap or a settled scroll chooses a row with a
 *          selection haptic, a disabled wheel or row refuses, and a scroll that lands on the chosen row snaps back;
 *          the picker holds its own keys when uncontrolled and reports every column; the date wheels clamp the day to
 *          the month and the time wheels turn the 12-hour period into a 24-hour time, kept left to right.
 * Boundary: React Native does not render in vitest, so it and the house Text are recording stand-ins that render plain
 *           DOM; what each wheel is handed is checked, not the scrolling.
 * Runtime: node
 * Governing contract: wave 3a forms and pickers (owner approval 2026-10-28); ADR 0302 (decision 3); ADR 0060; WCAG
 *          2.2 SC 4.1.2; ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { CalendarDate } from "@internationalized/date";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { forwardRef, useImperativeHandle, type ReactNode } from "react";

import type { DesignSystemState } from "#contracts/types/design-system-state.type";
import { DesignSystemContext } from "#native/design-system-provider/design-system-context";
import { WheelDatePicker } from "#native/wheel-picker/wheel-date-picker";
import { WheelPicker } from "#native/wheel-picker/wheel-picker";
import { WheelTimePicker } from "#native/wheel-picker/wheel-time-picker";

const state = vi.hoisted(() => ({
  views: [] as Record<string, unknown>[],
  scrollers: [] as Record<string, unknown>[],
  scrolled: [] as { y: number }[],
  played: [] as string[],
}));

vi.mock("react-native", async () => {
  const { createElement } = await import("react");
  return {
    View: (props: Record<string, unknown>) => {
      state.views.push(props);
      return createElement("div", null, props["children"] as ReactNode);
    },
    ScrollView: forwardRef((props: Record<string, unknown>, ref) => {
      useImperativeHandle(ref, () => ({
        scrollTo: (to: { y: number }) => state.scrolled.push(to),
      }));
      state.scrollers.push(props);
      return createElement("div", null, props["children"] as ReactNode);
    }),
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
vi.mock("#native/haptics/haptics", () => ({
  haptics: { play: (kind: string) => state.played.push(kind) },
}));
vi.mock("@stackra/i18n/react", () => ({ useNumerals: () => "latn" }));
vi.mock("#react/hooks/use-ui-text", () => ({ useUiText: () => (key: string) => key }));

const COLUMNS = [
  {
    id: "size",
    label: "Size",
    items: [
      { id: "s", label: "Small" },
      { id: "m", label: "Medium", isDisabled: true },
      { id: "l", label: "Large" },
    ],
  },
  { id: "tone", label: "Tone", items: [{ id: "red", label: "Red" }] },
];

const within = (node: ReactNode) =>
  render(
    <DesignSystemContext value={{ locale: "en-US", direction: "ltr" } as DesignSystemState}>
      {node}
    </DesignSystemContext>,
  );
const wheels = () => state.views.filter((view) => view["accessibilityRole"] === "adjustable");
const lastWheel = (label: string) =>
  [...wheels()].reverse().find((view) => view["accessibilityLabel"] === label) ?? {};
const act11y = (label: string, actionName: string) =>
  act(() =>
    (lastWheel(label)["onAccessibilityAction"] as (event: unknown) => void)({
      nativeEvent: { actionName },
    }),
  );
const settle = (index: number, y: number) =>
  act(() =>
    ((state.scrollers[index] ?? {})["onMomentumScrollEnd"] as (event: unknown) => void)({
      nativeEvent: { contentOffset: { y } },
    }),
  );

beforeEach(() => {
  state.views.length = 0;
  state.scrollers.length = 0;
  state.scrolled.length = 0;
  state.played.length = 0;
});

describe("WheelPicker (native)", () => {
  it("draws one adjustable wheel per column, speaking the first row and centring the band", () => {
    render(<WheelPicker columns={COLUMNS} label="Shirt" visibleCount={4} />);
    expect(state.views[0]?.["accessibilityLabel"]).toBe("Shirt");
    expect(state.views[1]?.["style"]).toEqual({ top: 80, height: 40 });
    expect(
      wheels().map((wheel) => [wheel["accessibilityLabel"], wheel["accessibilityValue"]]),
    ).toEqual([
      ["Size", { text: "Small" }],
      ["Tone", { text: "Red" }],
    ]);
    expect(state.scrollers[0]).toMatchObject({ scrollEnabled: true, style: { height: 200 } });
    expect(state.scrolled[0]).toEqual({ y: 0, animated: true });
  });

  it("steps past a disabled row and reports every column, holding its own keys", () => {
    const onChange = vi.fn();
    render(<WheelPicker columns={COLUMNS} onChange={onChange} />);
    act11y("Size", "increment");
    expect(onChange).toHaveBeenLastCalledWith({ size: "l", tone: "red" });
    expect(state.played).toEqual(["selection"]);
    expect(lastWheel("Size")["accessibilityValue"]).toEqual({ text: "Large" });
    act11y("Size", "decrement");
    expect(onChange).toHaveBeenLastCalledWith({ size: "s", tone: "red" });
    act11y("Size", "decrement");
    expect(onChange).toHaveBeenCalledTimes(2);
  });

  it("chooses a tapped row but refuses a disabled one or the chosen one", () => {
    const onChange = vi.fn();
    render(<WheelPicker columns={COLUMNS} onChange={onChange} />);
    fireEvent.click(screen.getByText("Medium"));
    fireEvent.click(screen.getByText("Small"));
    expect(onChange).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText("Large"));
    expect(onChange).toHaveBeenCalledWith({ size: "l", tone: "red" });
  });

  it("chooses where a scroll settles and snaps back when it settles on the chosen row", () => {
    const onChange = vi.fn();
    render(<WheelPicker columns={COLUMNS} value={{ size: "l" }} onChange={onChange} />);
    expect(lastWheel("Size")["accessibilityValue"]).toEqual({ text: "Large" });
    state.scrolled.length = 0;
    settle(0, 80);
    expect(state.scrolled).toEqual([{ y: 80, animated: true }]);
    settle(0, 0);
    expect(onChange).toHaveBeenCalledWith({ size: "s", tone: "red" });
    expect(lastWheel("Size")["accessibilityValue"]).toEqual({ text: "Large" });
  });

  it("refuses every change while disabled", () => {
    const onChange = vi.fn();
    render(<WheelPicker columns={COLUMNS} isDisabled onChange={onChange} />);
    expect(lastWheel("Size")["accessibilityState"]).toEqual({ disabled: true });
    expect(state.scrollers[0]?.["scrollEnabled"]).toBe(false);
    expect(String(state.views[0]?.["className"])).toContain("opacity-60");
    act11y("Size", "increment");
    fireEvent.click(screen.getByText("Large"));
    expect(onChange).not.toHaveBeenCalled();
  });

  it("falls back to the first row for an unknown key", () => {
    render(<WheelPicker columns={COLUMNS} defaultValue={{ size: "xl" }} />);
    expect(lastWheel("Size")["accessibilityValue"]).toEqual({ text: "Small" });
  });
});

describe("WheelDatePicker (native)", () => {
  it("speaks the day, month and year and clamps the day to a shorter month", () => {
    const onChange = vi.fn();
    within(
      <WheelDatePicker
        defaultValue={new CalendarDate(2026, 1, 31)}
        minYear={2025}
        maxYear={2027}
        onChange={onChange}
        label="Birthday"
      />,
    );
    expect(lastWheel("ui::wheel.day")["accessibilityValue"]).toBeDefined();
    expect(lastWheel("ui::wheel.year")["accessibilityValue"]).toEqual({ text: "2026" });
    act11y("ui::wheel.month", "increment");
    expect(onChange).toHaveBeenLastCalledWith(new CalendarDate(2026, 2, 28));
  });

  it("keeps the owner's day when controlled", () => {
    const onChange = vi.fn();
    within(<WheelDatePicker value={new CalendarDate(2026, 3, 10)} onChange={onChange} />);
    act11y("ui::wheel.year", "increment");
    expect(onChange).toHaveBeenLastCalledWith(new CalendarDate(2027, 3, 10));
    expect(lastWheel("ui::wheel.year")["accessibilityValue"]).toEqual({ text: "2026" });
  });

  it("starts on today without a value", () => {
    within(<WheelDatePicker />);
    expect(lastWheel("ui::wheel.year")["accessibilityValue"]).toEqual({
      text: String(new Date().getFullYear()),
    });
  });
});

describe("WheelTimePicker (native)", () => {
  it("runs left to right on 24-hour wheels and reports the time", () => {
    const onChange = vi.fn();
    within(
      <WheelTimePicker
        hourCycle={24}
        minuteStep={15}
        defaultValue={{ hour: 9, minute: 20 }}
        onChange={onChange}
      />,
    );
    expect(state.views[0]?.["style"]).toEqual({ direction: "ltr" });
    expect(lastWheel("ui::wheel.minute")["accessibilityValue"]).toEqual({ text: "15" });
    act11y("ui::wheel.hour", "increment");
    expect(onChange).toHaveBeenLastCalledWith({ hour: 10, minute: 15 });
    expect(lastWheel("ui::wheel.hour")["accessibilityValue"]).toEqual({ text: "10" });
  });

  it("adds a period wheel on 12 hours and turns pm into the afternoon", () => {
    const onChange = vi.fn();
    within(<WheelTimePicker hourCycle={12} value={{ hour: 9, minute: 0 }} onChange={onChange} />);
    expect(wheels().map((wheel) => wheel["accessibilityLabel"])).toContain("ui::wheel.period");
    act11y("ui::wheel.period", "increment");
    expect(onChange).toHaveBeenLastCalledWith({ hour: 21, minute: 0 });
  });

  it("takes the locale's hour cycle and starts at midnight", () => {
    within(<WheelTimePicker />);
    expect(wheels().map((wheel) => wheel["accessibilityLabel"])).toContain("ui::wheel.period");
  });
});
