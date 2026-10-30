/**
 * Stackra file contract:
 * Purpose: proves the native AngleSlider when controlled (reports a change but shows the caller's angle until it
 *          moves, snapped to the step; no report for the same angle), that a drag follows the touch and increment
 *          wraps past 359, that the quarter ticks draw only with `hasMarks`, that the visible readout is hidden from
 *          assistive technology, and that a disabled dial fades.
 * Boundary: React Native, react-native-svg and heroui-native are recording stand-ins; PanResponder hands back its
 *           config, so a drag is its move handler called with a position.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); WCAG 2.2 SC 2.5.7 and 4.1.2; ADR 0022 (test placement); STA-1371.
 */
// @vitest-environment jsdom
import { act, render } from "@testing-library/react";

import { AngleSlider } from "#native/angle-slider/angle-slider";

const state = vi.hoisted(() => ({
  views: [] as Record<string, unknown>[],
  lines: 0,
  texts: [] as Record<string, unknown>[],
}));

vi.mock("heroui-native", () => ({
  useThemeColor: (names: string[]) => names.map((name) => `color:${name}`),
}));
vi.mock("react-native", async () => {
  const { createElement } = await import("react");
  return {
    View: (props: Record<string, unknown>) => {
      state.views.push(props);
      return createElement("div", null, props["children"] as never);
    },
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
    Line: () => {
      state.lines += 1;
      return null;
    },
  };
});
vi.mock("#native/text/text", async () => {
  const { createElement } = await import("react");
  return {
    Text: (props: Record<string, unknown>) => {
      state.texts.push(props);
      return createElement("span", null, props["children"] as never);
    },
  };
});

/** The last adjustable view drawn. */
const dial = (): Record<string, unknown> =>
  [...state.views].reverse().find((view) => view["accessibilityRole"] === "adjustable") ?? {};

/** Runs an accessibility action on the dial. */
const action = (actionName: string): void =>
  act(() =>
    (dial()["onAccessibilityAction"] as (event: unknown) => void)({ nativeEvent: { actionName } }),
  );

describe("AngleSlider controlled (native)", () => {
  beforeEach(() => {
    state.views = [];
    state.lines = 0;
    state.texts = [];
  });

  it("shows the caller's snapped angle and only reports a change", () => {
    const onChange = vi.fn();
    render(<AngleSlider label="Hue" value={44} step={15} onChange={onChange} />);
    expect(dial()["accessibilityValue"]).toMatchObject({ now: 45 });
    action("increment");
    expect(onChange).toHaveBeenLastCalledWith(60);
    expect(dial()["accessibilityValue"]).toMatchObject({ now: 45 });
    // A touch straight up from the centre is 0 degrees, the top of the dial.
    act(() =>
      (dial()["onPanResponderMove"] as (event: unknown) => void)({
        nativeEvent: { locationX: 80, locationY: 0 },
      }),
    );
    expect(onChange).toHaveBeenLastCalledWith(0);
    onChange.mockClear();
    act(() =>
      (dial()["onPanResponderMove"] as (event: unknown) => void)({
        nativeEvent: { locationX: 160, locationY: 80 },
      }),
    );
    expect(onChange).toHaveBeenLastCalledWith(90);
  });

  it("ignores a move to the angle it already shows", () => {
    const onChange = vi.fn();
    render(<AngleSlider label="Hue" value={90} onChange={onChange} />);
    act(() =>
      (dial()["onPanResponderMove"] as (event: unknown) => void)({
        nativeEvent: { locationX: 160, locationY: 80 },
      }),
    );
    expect(onChange).not.toHaveBeenCalled();
  });

  it("wraps past 359 on increment", () => {
    const onChange = vi.fn();
    render(<AngleSlider label="Hue" defaultValue={359} onChange={onChange} />);
    action("increment");
    expect(onChange).toHaveBeenLastCalledWith(0);
    expect(dial()["accessibilityValue"]).toMatchObject({ now: 0 });
    expect((dial()["onMoveShouldSetPanResponder"] as () => boolean)()).toBe(true);
  });

  it("draws the quarter ticks only with hasMarks", () => {
    render(<AngleSlider label="Hue" />);
    const plain = state.lines;
    state.lines = 0;
    render(<AngleSlider label="Hue" hasMarks />);
    expect(state.lines - plain).toBe(4);
  });

  it("hides the visible readout and fades when disabled", () => {
    render(<AngleSlider label="Hue" defaultValue={30} isDisabled className="m-2" />);
    const readout = [...state.texts].reverse().find((text) => text["accessibilityElementsHidden"]);
    expect(readout).toMatchObject({ importantForAccessibility: "no-hide-descendants" });
    expect(dial()["accessibilityState"]).toEqual({ disabled: true });
    expect(String(state.views[0]?.["className"])).toMatch(/opacity-50.*m-2/u);
    expect((dial()["onMoveShouldSetPanResponder"] as () => boolean)()).toBe(false);
  });
});
