/**
 * Stackra file contract:
 * Purpose: proves the native SetupGuide draws its title, a named progress bar and the tasks, reports a tick with the
 *          task's id, shows an open task's action, reports `expanded` on its toggle and hides the list from it, and at
 *          100% shows the done line, plays a success haptic once and folds an uncontrolled list.
 * Boundary: React Native, react-native-reanimated and the house children do not run in vitest, so they are replaced by
 *          recording stand-ins that render plain DOM; what reaches them is checked, not the animation on a device.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); WCAG 2.2 SC 4.1.2; ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";

import type { SetupGuideTask } from "#contracts/types/setup-guide-task.type";
import { SetupGuide } from "#native/setup-guide/setup-guide";

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

vi.mock("#native/card/card", async () => {
  const { createElement } = await import("react");
  const part = (props: Record<string, unknown>) =>
    createElement("div", {}, props["children"] as never);
  return {
    Card: Object.assign(part, { Header: part, Title: part, Description: part, Content: part }),
  };
});

vi.mock("#native/button/button", async () => {
  const { createElement } = await import("react");
  return {
    Button: (props: Record<string, unknown>) =>
      createElement(
        "button",
        { type: "button", onClick: props["onPress"] as () => void },
        props["children"] as never,
      ),
  };
});

vi.mock("#native/icon-button/icon-button", async () => {
  const { createElement } = await import("react");
  return {
    IconButton: (props: Record<string, unknown>) =>
      createElement("button", {
        type: "button",
        "aria-label": props["label"] as string,
        "aria-expanded": (props["accessibilityState"] as { expanded: boolean }).expanded,
        onClick: props["onPress"] as () => void,
      }),
  };
});

vi.mock("#native/checkbox/checkbox", async () => {
  const { createElement } = await import("react");
  return {
    Checkbox: (props: Record<string, unknown>) =>
      createElement("input", {
        type: "checkbox",
        "aria-label": props["label"] as string,
        checked: props["value"] as boolean,
        readOnly: true,
        onClick: () => (props["onChange"] as (next: boolean) => void)(!(props["value"] as boolean)),
      }),
  };
});

vi.mock("#native/progress-bar/progress-bar", async () => {
  const { createElement } = await import("react");
  return {
    ProgressBar: (props: Record<string, unknown>) =>
      createElement("div", { role: "progressbar", "aria-label": props["label"] as string }),
  };
});

vi.mock("#native/icon/icon", () => ({ Icon: () => null }));

const WORDS = {
  title: "Set up your store",
  progressLabel: (done: number, total: number) => `${done} of ${total} done`,
  completeLabel: "All set",
  toggleLabel: (isExpanded: boolean) => (isExpanded ? "Hide tasks" : "Show tasks"),
};

const open = (onAction = vi.fn()): SetupGuideTask[] => [
  { id: "product", title: "Add a product", isComplete: true },
  { id: "payments", title: "Set up payments", isComplete: false, actionLabel: "Connect", onAction },
];

describe("SetupGuide (native)", () => {
  beforeEach(() => {
    state.played = [];
  });

  it("draws the title, the progress and the tasks, and reports a tick", () => {
    const onCompleteChange = vi.fn();
    const onAction = vi.fn();
    render(<SetupGuide {...WORDS} tasks={open(onAction)} onCompleteChange={onCompleteChange} />);
    expect(screen.getByText("Set up your store")).toBeTruthy();
    expect(screen.getByRole("progressbar", { name: "1 of 2 done" })).toBeTruthy();
    fireEvent.click(screen.getByRole("checkbox", { name: "Set up payments" }));
    expect(onCompleteChange).toHaveBeenCalledWith("payments", true);
    fireEvent.click(screen.getByText("Connect"));
    expect(onAction).toHaveBeenCalledOnce();
  });

  it("hides the list from its toggle", () => {
    render(<SetupGuide {...WORDS} tasks={open()} />);
    const toggle = screen.getByRole("button", { name: "Hide tasks" });
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    fireEvent.click(toggle);
    expect(screen.queryAllByRole("checkbox")).toHaveLength(0);
    expect(screen.getByRole("button", { name: "Show tasks" })).toBeTruthy();
  });

  it("celebrates once at 100% and folds an uncontrolled list", () => {
    const { rerender } = render(<SetupGuide {...WORDS} tasks={open()} />);
    const all = open().map((task) => ({ ...task, isComplete: true }));
    rerender(<SetupGuide {...WORDS} tasks={all} />);
    rerender(<SetupGuide {...WORDS} tasks={all} />);
    expect(screen.getByText("All set")).toBeTruthy();
    expect(state.played).toEqual(["success"]);
    expect(screen.queryAllByRole("checkbox")).toHaveLength(0);
  });
});
