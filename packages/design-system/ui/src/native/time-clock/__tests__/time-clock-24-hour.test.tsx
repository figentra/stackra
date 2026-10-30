/**
 * Stackra file contract:
 * Purpose: proves the native TimeClock on a 24-hour face: two-digit hours, no AM/PM group, the inner and outer rings
 *          picking hours twelve apart; the minute button switching the face to minutes, where a step wraps within
 *          the hour and a release stays put; a controlled clock that reports but shows the caller's time, with no
 *          report for the same time; and a disabled clock that refuses touches and actions and fades.
 * Boundary: React Native, react-native-svg, heroui-native and the design-system hook are recording stand-ins;
 *           PanResponder hands back its config, so a touch is its handlers called with a position.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); WCAG 2.2 SC 2.5.7 and 4.1.2; ADR 0022 (test placement); STA-1371.
 */
// @vitest-environment jsdom
import { act, render, screen } from "@testing-library/react";

import { TimeClock } from "#native/time-clock/time-clock";

const state = vi.hoisted(() => ({ views: [] as Record<string, unknown>[] }));

vi.mock("heroui-native", () => ({
  useThemeColor: (names: string[]) => names.map((name) => `color:${name}`),
}));
vi.mock("#native/design-system-provider/use-design-system", () => ({
  useDesignSystem: () => ({ locale: "en-GB" }),
}));
vi.mock("react-native", async () => {
  const { createElement } = await import("react");
  return {
    View: (props: Record<string, unknown>) => {
      state.views.push(props);
      return createElement("div", null, props["children"] as never);
    },
    Pressable: (props: Record<string, unknown>) =>
      createElement(
        "button",
        {
          type: "button",
          "aria-label": props["accessibilityLabel"],
          "aria-pressed": (props["accessibilityState"] as { selected?: boolean }).selected,
          onClick: props["onPress"],
        },
        props["children"] as never,
      ),
    PanResponder: { create: (config: Record<string, unknown>) => ({ panHandlers: config }) },
  };
});
vi.mock("react-native-svg", async () => {
  const { createElement } = await import("react");
  const pass = (props: Record<string, unknown>) =>
    createElement("div", null, props["children"] as never);
  return {
    default: pass,
    Circle: pass,
    Line: pass,
    Text: (props: Record<string, unknown>) =>
      createElement("span", null, props["children"] as never),
  };
});
vi.mock("#native/text/text", async () => (await import("#testing/fakes/text-dom")).textDom);

/** The last face drawn. */
const face = (): Record<string, unknown> =>
  [...state.views].reverse().find((view) => view["accessibilityRole"] === "adjustable") ?? {};
/** Runs one of the face's handlers. */
const run = (name: string, event: unknown): void =>
  act(() => {
    (face()[name] as (e: unknown) => void)(event);
  });
/** A touch at 3 o'clock, `reach` points from the centre of the 256-point face. */
const threeOClock = (reach: number) => ({
  nativeEvent: { locationX: 128 + reach, locationY: 128 },
});

describe("TimeClock 24-hour (native)", () => {
  beforeEach(() => {
    state.views = [];
  });

  it("draws two-digit hours without AM/PM and picks hours on both rings", () => {
    const onChange = vi.fn();
    render(
      <TimeClock
        hourCycle={24}
        label="Opens at"
        defaultValue={{ hour: 7, minute: 5 }}
        onChange={onChange}
      />,
    );
    expect(screen.getByText("Opens at")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Hour" }).textContent).toBe("07");
    expect(screen.getByRole("button", { name: "Minute" }).textContent).toBe("05");
    expect(screen.queryByRole("button", { name: "PM" })).toBeNull();
    run("onPanResponderGrant", threeOClock(102));
    const outer = onChange.mock.lastCall?.[0] as { hour: number };
    run("onPanResponderMove", threeOClock(66));
    const inner = onChange.mock.lastCall?.[0] as { hour: number };
    expect(Math.abs(outer.hour - inner.hour)).toBe(12);
    expect([outer.hour, inner.hour]).toContain(15);
  });

  it("switches to minutes from its button and stays there on release", () => {
    const onChange = vi.fn();
    render(<TimeClock hourCycle={24} minuteStep={5} onChange={onChange} />);
    act(() => screen.getByRole("button", { name: "Minute" }).click());
    expect(screen.getByRole("button", { name: "Minute" }).getAttribute("aria-pressed")).toBe(
      "true",
    );
    expect(face()["accessibilityValue"]).toMatchObject({ max: 59, now: 0 });
    run("onAccessibilityAction", { nativeEvent: { actionName: "decrement" } });
    // Minutes wrap within the hour.
    expect(onChange).toHaveBeenLastCalledWith({ hour: 12, minute: 55 });
    run("onPanResponderRelease", {});
    expect(face()["accessibilityLabel"]).toBe("Minute");
  });

  it("shows the caller's time and reports only a change", () => {
    const onChange = vi.fn();
    render(<TimeClock hourCycle={24} value={{ hour: 15, minute: 0 }} onChange={onChange} />);
    // One ring at 3 o'clock is 15, the time already shown; only the other one reports.
    run("onPanResponderGrant", threeOClock(102));
    run("onPanResponderGrant", threeOClock(66));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.lastCall?.[0]).toMatchObject({ minute: 0 });
    expect(face()["accessibilityValue"]).toMatchObject({ now: 15 });
    expect(screen.getByRole("button", { name: "Hour" }).textContent).toBe("15");
  });

  it("refuses touches and actions when disabled", () => {
    const onChange = vi.fn();
    render(<TimeClock hourCycle={12} isDisabled className="m-1" onChange={onChange} />);
    expect((face()["onStartShouldSetPanResponder"] as () => boolean)()).toBe(false);
    expect((face()["onMoveShouldSetPanResponder"] as () => boolean)()).toBe(false);
    run("onAccessibilityAction", { nativeEvent: { actionName: "increment" } });
    expect(onChange).not.toHaveBeenCalled();
    expect(face()["accessibilityState"]).toEqual({ disabled: true });
    expect(String(state.views[0]?.["className"])).toMatch(/opacity-50.*m-1/u);
  });
});
