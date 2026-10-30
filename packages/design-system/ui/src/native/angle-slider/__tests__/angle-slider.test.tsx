/**
 * Stackra file contract:
 * Purpose: proves the native AngleSlider is one adjustable view named by its label that speaks its angle in degrees,
 *          steps and wraps on the increment and decrement actions, turns to the angle of a touch, and refuses
 *          changes when disabled.
 * Boundary: React Native, react-native-svg and heroui-native are recording stand-ins; PanResponder hands back its
 *           config, so a touch is its grant handler called with a position.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement); STA-1371 (wave D, owner approval 2026-10-30).
 */
// @vitest-environment jsdom
import { act, render } from "@testing-library/react";

import { AngleSlider } from "#native/angle-slider/angle-slider";

const state = vi.hoisted(() => ({ views: [] as Record<string, unknown>[] }));

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
  return { default: pass, Circle: pass, Line: pass };
});
vi.mock("#native/text/text", async () => (await import("#testing/fakes/text-dom")).textDom);

/** The last adjustable view drawn. */
const dial = () =>
  [...state.views].reverse().find((view) => view["accessibilityRole"] === "adjustable") ?? {};

describe("AngleSlider (native)", () => {
  beforeEach(() => {
    state.views = [];
  });

  it("speaks degrees and steps with the accessibility actions", () => {
    const onChange = vi.fn();
    render(<AngleSlider label="Rotation" defaultValue={0} step={15} onChange={onChange} />);
    expect(dial()).toMatchObject({
      accessibilityLabel: "Rotation",
      accessibilityValue: { min: 0, max: 359, now: 0, text: "0 degrees" },
    });
    act(() => {
      (dial()["onAccessibilityAction"] as (e: unknown) => void)({
        nativeEvent: { actionName: "decrement" },
      });
    });
    expect(onChange).toHaveBeenLastCalledWith(345);
    expect(dial()["accessibilityValue"]).toMatchObject({ now: 345 });
  });

  it("turns to a touch on the dial", () => {
    const onChange = vi.fn();
    render(<AngleSlider label="Rotation" size={100} onChange={onChange} />);
    act(() => {
      (dial()["onPanResponderGrant"] as (e: unknown) => void)({
        nativeEvent: { locationX: 50, locationY: 100 },
      });
    });
    expect(onChange).toHaveBeenLastCalledWith(180);
  });

  it("refuses changes when disabled", () => {
    const onChange = vi.fn();
    render(<AngleSlider label="Rotation" isDisabled onChange={onChange} />);
    expect((dial()["onStartShouldSetPanResponder"] as () => boolean)()).toBe(false);
    (dial()["onAccessibilityAction"] as (e: unknown) => void)({
      nativeEvent: { actionName: "increment" },
    });
    expect(onChange).not.toHaveBeenCalled();
  });
});
