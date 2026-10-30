/**
 * Stackra file contract:
 * Purpose: proves the native MorphButton: idle and error take the press with their words, loading and success turn
 *          round (a spinner, then a check) and refuse it, the button says busy while loading, each new non-idle state
 *          is announced, success settles back to idle after `successDuration` and calls `onSuccessEnd`, a solid
 *          variant tints for success and error, a soft one turns danger on error, and full motion shakes the error
 *          while no motion jumps straight to the tint without fades.
 * Boundary: React Native, heroui-native and Reanimated do not run in vitest, so they and the house Button and Icon are
 *           recording stand-ins that render plain DOM; what each is handed is checked, not the drawing.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); WCAG 2.2 SC 2.3.3 and 4.1.3; ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { act, render } from "@testing-library/react";
import type { ReactNode } from "react";

import type { MotionLevel } from "#contracts/enums/motion-level.enum";
import { MorphButton } from "#native/morph-button/morph-button";
import type { MorphButtonProps } from "#native/morph-button/morph-button.props";

const state = vi.hoisted(() => ({
  motion: "full" as string,
  button: {} as Record<string, unknown>,
  views: [] as Record<string, unknown>[],
  sets: [] as unknown[],
  announced: [] as string[],
  inks: [] as string[],
}));

/** A stand-in for Reanimated's fade builders: `duration(ms)` returns `{ [name]: ms }`. */
const motion = vi.hoisted(() => ({
  fade: (name: string) => ({ duration: (ms: number) => ({ [name]: ms }) }),
}));

vi.mock("react-native", () => ({
  AccessibilityInfo: { announceForAccessibility: (words: string) => state.announced.push(words) },
  StyleSheet: { absoluteFill: { position: "absolute" } },
}));
vi.mock("react-native-reanimated", async () => {
  const { createElement } = await import("react");
  const { fade } = motion;
  return {
    default: {
      View: (props: Record<string, unknown>) => {
        state.views.push(props);
        return createElement("div", null, props["children"] as ReactNode);
      },
    },
    FadeIn: fade("in"),
    FadeOut: fade("out"),
    LinearTransition: fade("layout"),
    useSharedValue: (initial: number) => ({
      value: initial,
      set: (next: unknown) => state.sets.push(next),
    }),
    useAnimatedStyle: (worklet: () => unknown) => worklet(),
    withTiming: (to: number) => ({ timing: to }),
    withSequence: (...steps: unknown[]) => ({ sequence: steps }),
  };
});
vi.mock("heroui-native", async () => {
  const { createElement } = await import("react");
  return {
    Button: {
      Label: (props: Record<string, unknown>) =>
        createElement("span", null, props["children"] as ReactNode),
    },
    Spinner: () => createElement("i", { "data-testid": "spinner" }),
    cn: (...names: unknown[]) => names.filter(Boolean).join(" "),
    useThemeColor: (name: string) => {
      state.inks.push(name);
      return `color:${name}`;
    },
  };
});
vi.mock("#native/button/button", async () => {
  const { createElement } = await import("react");
  return {
    Button: (props: Record<string, unknown>) => {
      state.button = props;
      return createElement("div", null, props["children"] as ReactNode);
    },
  };
});
vi.mock("#native/icon/icon", async () => {
  const { createElement } = await import("react");
  return { Icon: () => createElement("i", { "data-testid": "check" }) };
});
vi.mock("#native/design-system-provider/use-motion", () => ({
  useMotion: () => state.motion as MotionLevel,
}));

const labels = { idle: "Pay", loading: "Paying", success: "Paid", error: "Declined" };
const draw = (props: Partial<MorphButtonProps> = {}) =>
  render(<MorphButton labels={labels} {...props} />);

beforeEach(() => {
  state.motion = "full";
  state.button = {};
  state.views.length = 0;
  state.sets.length = 0;
  state.announced.length = 0;
  state.inks.length = 0;
});
afterEach(() => vi.useRealTimers());

describe("MorphButton (native)", () => {
  it("takes the press while idle with its idle words, and fades and slides by default", () => {
    const onPress = vi.fn();
    const { getByText } = draw({ onPress, className: "wide", isDisabled: false });
    expect(state.button).toMatchObject({
      label: "Pay",
      variant: "primary",
      size: "md",
      onPress,
      isDisabled: false,
      accessibilityState: { busy: false },
    });
    expect(String(state.button["className"])).toContain("wide");
    expect(getByText("Pay")).toBeTruthy();
    expect(state.views[0]).toMatchObject({ layout: { layout: expect.any(Number) } });
    expect(state.views.some((view) => view["entering"])).toBe(true);
    expect(state.announced).toEqual([]);
    expect(state.inks).toContain("accent-foreground");
  });

  it("turns round with a spinner while loading, refuses the press and says busy", () => {
    const onPress = vi.fn();
    const { rerender, getByTestId } = draw({ onPress });
    rerender(<MorphButton labels={labels} onPress={onPress} state="loading" />);
    expect(getByTestId("spinner")).toBeTruthy();
    expect(state.button).not.toHaveProperty("onPress");
    expect(state.button).toMatchObject({ label: "Paying", accessibilityState: { busy: true } });
    expect(String(state.button["className"])).toContain("rounded-[var(--radius-pill)]");
    expect(state.announced).toEqual(["Paying"]);
  });

  it("shows the check on success, tints it, then settles to idle and calls onSuccessEnd", () => {
    vi.useFakeTimers();
    const onSuccessEnd = vi.fn();
    const { getByTestId, getByText } = draw({
      state: "success",
      successDuration: 500,
      onSuccessEnd,
    });
    expect(getByTestId("check")).toBeTruthy();
    expect(state.sets).toContainEqual({ timing: 1 });
    act(() => vi.advanceTimersByTime(500));
    expect(onSuccessEnd).toHaveBeenCalledOnce();
    expect(getByText("Pay")).toBeTruthy();
  });

  it("shakes into its error words under full motion and keeps the press", () => {
    const onPress = vi.fn();
    const { rerender } = draw({ onPress });
    rerender(<MorphButton labels={labels} onPress={onPress} state="error" />);
    expect(state.button).toMatchObject({ label: "Declined", onPress });
    expect(state.sets.some((set) => typeof set === "object" && set && "sequence" in set)).toBe(
      true,
    );
    expect(state.announced).toEqual(["Declined"]);
  });

  it("turns a soft variant danger on error, tints nothing and uses the foreground ink", () => {
    draw({ state: "error", variant: "secondary" });
    expect(state.button["variant"]).toBe("danger-soft");
    expect(state.sets).toContainEqual({ timing: 0 });
    expect(state.inks).toContain("foreground");
  });

  it("uses the danger ink and falls back to the idle words for a missing label", () => {
    draw({ state: "loading", variant: "danger", labels: { idle: "Go" } as typeof labels });
    expect(state.inks).toContain("danger-foreground");
    expect(state.button["label"]).toBe("Go");
  });

  it("jumps to the tint without fades, layout or shake when motion is off", () => {
    state.motion = "none";
    draw({ state: "error" });
    expect(state.sets).toEqual([1]);
    expect(state.views[0]).not.toHaveProperty("layout");
    expect(state.views.some((view) => view["entering"])).toBe(false);
  });

  it("fades without the layout slide or shake under reduced motion", () => {
    state.motion = "reduced";
    draw({ state: "error" });
    expect(state.views[0]).not.toHaveProperty("layout");
    expect(state.sets).toEqual([{ timing: 1 }]);
  });
});
