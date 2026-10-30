/**
 * Stackra file contract:
 * Purpose: proves the native TimeClock's face is one adjustable view that speaks the whole time and steps on the
 *          accessibility actions, picks the touched hour and then shows the minutes, switches AM and PM, and draws
 *          its numerals as SVG Text.
 * Boundary: React Native, react-native-svg, heroui-native and the design-system hook are recording stand-ins;
 *           PanResponder hands back its config, so a touch is its handlers called with a position.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement); STA-1371 (wave D, owner approval 2026-10-30).
 */
// @vitest-environment jsdom
import { act, render, screen } from "@testing-library/react";

import { TimeClock } from "#native/time-clock/time-clock";

const state = vi.hoisted(() => ({ views: [] as Record<string, unknown>[] }));

vi.mock("heroui-native", () => ({
  useThemeColor: (names: string[]) => names.map((name) => `color:${name}`),
}));
vi.mock("#native/design-system-provider/use-design-system", () => ({
  useDesignSystem: () => ({ locale: "en-US" }),
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
        { type: "button", "aria-label": props["accessibilityLabel"], onClick: props["onPress"] },
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
const face = () =>
  [...state.views].reverse().find((view) => view["accessibilityRole"] === "adjustable") ?? {};
/** Runs one of the face's handlers. */
const run = (name: string, event: unknown) =>
  act(() => {
    (face()[name] as (e: unknown) => void)(event);
  });

describe("TimeClock (native)", () => {
  beforeEach(() => {
    state.views = [];
  });

  it("speaks the time and steps on the accessibility actions", () => {
    const onChange = vi.fn();
    render(
      <TimeClock hourCycle={12} defaultValue={{ hour: 15, minute: 45 }} onChange={onChange} />,
    );
    expect(face()["accessibilityLabel"]).toBe("Hour");
    expect((face()["accessibilityValue"] as { text: string }).text).toMatch(/^3:45\sPM$/);
    run("onAccessibilityAction", { nativeEvent: { actionName: "increment" } });
    expect(onChange).toHaveBeenLastCalledWith({ hour: 16, minute: 45 });
  });

  it("picks the touched hour and then shows the minutes", () => {
    const onChange = vi.fn();
    render(<TimeClock hourCycle={12} defaultValue={{ hour: 9, minute: 0 }} onChange={onChange} />);
    // 3 o'clock on the 256-point face.
    run("onPanResponderGrant", { nativeEvent: { locationX: 230, locationY: 128 } });
    expect(onChange).toHaveBeenLastCalledWith({ hour: 3, minute: 0 });
    run("onPanResponderRelease", {});
    expect(face()["accessibilityLabel"]).toBe("Minute");
  });

  it("switches AM and PM and draws its numerals", () => {
    const onChange = vi.fn();
    render(<TimeClock hourCycle={12} defaultValue={{ hour: 9, minute: 0 }} onChange={onChange} />);
    act(() => {
      screen.getByRole("button", { name: "PM" }).click();
    });
    expect(onChange).toHaveBeenLastCalledWith({ hour: 21, minute: 0 });
    expect(screen.getByText("11")).toBeTruthy();
  });
});
