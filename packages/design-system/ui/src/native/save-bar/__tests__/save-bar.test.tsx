/**
 * Stackra file contract:
 * Purpose: proves the native SaveBar draws nothing while clean, a named toolbar with the message, Discard and Save
 *          while dirty, announces the message, keeps Save busy while its promise is pending, and on a new
 *          `attentionKey` plays a warning haptic and shakes, but only plays the haptic under reduced motion.
 * Boundary: React Native, react-native-reanimated and the house children do not run in vitest, so they are replaced by
 *          recording stand-ins that render plain DOM; what reaches them is checked, not the animation on a device.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); WCAG 2.2 SC 4.1.2, 4.1.3; ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { act, fireEvent, render, screen } from "@testing-library/react";

import { SaveBar } from "#native/save-bar/save-bar";

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

vi.mock("#native/button/button", async () => {
  const { createElement } = await import("react");
  return {
    Button: (props: Record<string, unknown>) =>
      createElement(
        "button",
        {
          type: "button",
          "data-loading": props["isLoading"] ? "true" : undefined,
          disabled: props["isDisabled"] === true,
          onClick: props["onPress"] as () => void,
        },
        props["children"] as never,
      ),
  };
});

vi.mock("#native/card/card", async () => {
  const { createElement } = await import("react");
  return {
    Card: (props: Record<string, unknown>) =>
      createElement(
        "div",
        { "data-role": props["role"], "aria-label": props["accessibilityLabel"] },
        props["children"] as never,
      ),
  };
});

const WORDS = {
  message: "Unsaved changes",
  saveLabel: "Save",
  discardLabel: "Discard",
  label: "Bar",
};

describe("SaveBar (native)", () => {
  beforeEach(() => {
    state.announced = [];
    state.played = [];
    state.sets = [];
    state.reduced = false;
  });

  it("draws nothing while clean, and a named toolbar announced once dirty", () => {
    const onDiscard = vi.fn();
    const { container, rerender } = render(
      <SaveBar isDirty={false} onSave={vi.fn()} onDiscard={onDiscard} {...WORDS} />,
    );
    expect(container.textContent).toBe("");
    rerender(<SaveBar isDirty onSave={vi.fn()} onDiscard={onDiscard} {...WORDS} />);
    expect(screen.getByLabelText("Bar").getAttribute("data-role")).toBe("toolbar");
    expect(state.announced).toEqual(["Unsaved changes"]);
    fireEvent.click(screen.getByText("Discard"));
    expect(onDiscard).toHaveBeenCalledOnce();
  });

  it("keeps Save busy while the save runs", async () => {
    let finish: (() => void) | undefined;
    const onSave = () =>
      new Promise<void>((resolve) => {
        finish = resolve;
      });
    render(<SaveBar isDirty onSave={onSave} onDiscard={vi.fn()} {...WORDS} />);
    fireEvent.click(screen.getByText("Save"));
    expect(screen.getByText("Save").getAttribute("data-loading")).toBe("true");
    await act(async () => {
      finish?.();
      await Promise.resolve();
    });
    expect(screen.getByText("Save").hasAttribute("data-loading")).toBe(false);
  });

  it("shakes and warns on a new attention key, and only warns under reduced motion", () => {
    const props = { isDirty: true, onSave: vi.fn(), onDiscard: vi.fn(), ...WORDS };
    const { rerender } = render(<SaveBar {...props} attentionKey={0} />);
    expect(state.played).toEqual([]);
    rerender(<SaveBar {...props} attentionKey={1} />);
    expect(state.played).toEqual(["warning"]);
    expect(state.sets).toHaveLength(1);
    state.reduced = true;
    rerender(<SaveBar {...props} attentionKey={2} />);
    expect(state.played).toEqual(["warning", "warning"]);
    expect(state.sets).toHaveLength(1);
  });
});
