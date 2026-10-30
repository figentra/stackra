/**
 * Stackra file contract:
 * Purpose: proves the native InlineLoading draws nothing while idle, the spinner or the tone's icon with the state's
 *          text after, announces each new text, and plays a success or error haptic only on a change to it (and none
 *          with `playsHaptics` off).
 * Boundary: React Native, react-native-reanimated and the house children do not run in vitest, so they are replaced by
 *          recording stand-ins that render plain DOM; what reaches them is checked, not the animation on a device.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); WCAG 2.2 SC 4.1.3; ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";

import { InlineLoading } from "#native/inline-loading/inline-loading";

/** What the stand-ins were handed, and the knobs a test turns. */
const state = vi.hoisted(() => ({
  reduced: false,
  announced: [] as string[],
  played: [] as string[],
  sets: [] as unknown[],
}));

vi.mock("react-native", async () => {
  const { createElement } = await import("react");
  return {
    AccessibilityInfo: { announceForAccessibility: (text: string) => state.announced.push(text) },
    View: (props: Record<string, unknown>) =>
      createElement(
        "div",
        { "data-role": props["role"], "aria-label": props["accessibilityLabel"] },
        props["children"] as never,
      ),
  };
});

vi.mock("react-native-reanimated", async () => {
  const { createElement } = await import("react");
  const builder: unknown = new Proxy({}, { get: () => () => builder });
  return {
    default: {
      View: (props: Record<string, unknown>) =>
        createElement("div", { "data-animated": "true" }, props["children"] as never),
    },
    ReduceMotion: { System: "system" },
    FadeIn: builder,
    FadeOut: builder,
    ZoomIn: builder,
    ZoomOut: builder,
    SlideInDown: builder,
    SlideOutDown: builder,
    useReducedMotion: () => state.reduced,
    useSharedValue: (value: unknown) => ({
      get: () => value,
      set: (next: unknown) => state.sets.push(next),
    }),
    useAnimatedStyle: (worklet: () => unknown) => worklet(),
    withTiming: (to: number) => ({ timing: to }),
    withSequence: (...steps: unknown[]) => ({ sequence: steps }),
  };
});

vi.mock("#native/haptics/haptics", () => ({
  haptics: { play: (kind: string) => state.played.push(kind) },
}));

vi.mock("#native/text/text", async () => {
  const { createElement } = await import("react");
  return {
    Text: (props: Record<string, unknown>) => createElement("span", {}, props["children"] as never),
  };
});

vi.mock("#native/spinner/spinner", async () => {
  const { createElement } = await import("react");
  return { Spinner: () => createElement("i", { "data-testid": "spinner" }) };
});

vi.mock("#native/icon/icon", async () => {
  const { createElement } = await import("react");
  return {
    Icon: (props: Record<string, unknown>) =>
      createElement("i", { "data-testid": "icon", "data-name": props["name"] }),
  };
});

const LABELS = { loadingLabel: "Charging card", successLabel: "Paid", errorLabel: "Card declined" };

describe("InlineLoading (native)", () => {
  beforeEach(() => {
    state.announced = [];
    state.played = [];
  });

  it("draws nothing while idle and announces nothing", () => {
    render(<InlineLoading status="idle" {...LABELS} />);
    expect(screen.queryByTestId("spinner")).toBeNull();
    expect(state.announced).toEqual([]);
  });

  it("swaps the spinner for the outcome, announcing each text and playing its haptic", () => {
    const { rerender } = render(<InlineLoading status="loading" {...LABELS} />);
    expect(screen.getByTestId("spinner")).toBeTruthy();
    expect(state.played).toEqual([]);
    rerender(<InlineLoading status="success" {...LABELS} />);
    expect(screen.getByTestId("icon").getAttribute("data-name")).toBe("circle-check");
    rerender(<InlineLoading status="error" {...LABELS} />);
    expect(screen.getByText("Card declined")).toBeTruthy();
    expect(state.announced).toEqual(["Charging card", "Paid", "Card declined"]);
    expect(state.played).toEqual(["success", "error"]);
  });

  it("stays silent to the touch with playsHaptics off", () => {
    const { rerender } = render(
      <InlineLoading status="loading" playsHaptics={false} {...LABELS} />,
    );
    rerender(<InlineLoading status="success" playsHaptics={false} {...LABELS} />);
    expect(state.played).toEqual([]);
  });
});
