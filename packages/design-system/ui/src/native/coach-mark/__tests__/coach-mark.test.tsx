/**
 * Stackra file contract:
 * Purpose: proves the native CoachMark renders nothing closed; open, measures the target and glides the four panes
 *          and the beacon to it (jumping, with no pulse, under reduce motion), shows a header-titled callout with
 *          "Step n of m"; Next and Back walk the steps; Done finishes `done`; Skip and the Android back button finish
 *          `skipped`.
 * Boundary: React Native does not render in vitest, so react-native, Reanimated, the design-system context and the
 *           typography, surface and button are replaced by recording stand-ins that render plain DOM; `useUiText`
 *           echoes the key and its values.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); GAPS.md row 39; ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode, RefObject } from "react";
import type { View } from "react-native";

import { CoachMark } from "#native/coach-mark/coach-mark";

const state = vi.hoisted(() => ({
  reduced: false,
  modal: undefined as Record<string, unknown> | undefined,
  sets: [] as unknown[],
  heading: {} as Record<string, unknown>,
}));

vi.mock("react-native", async () => {
  const { createElement } = await import("react");
  return {
    Modal: (props: Record<string, unknown>) => {
      state.modal = props;
      return createElement("div", { role: "dialog" }, props["children"] as ReactNode);
    },
    View: (props: Record<string, unknown>) =>
      createElement("div", null, props["children"] as ReactNode),
    useWindowDimensions: () => ({ width: 400, height: 800 }),
  };
});
vi.mock("react-native-reanimated", async () => {
  const { createElement } = await import("react");
  return {
    default: {
      View: (props: Record<string, unknown>) =>
        createElement("div", { "data-animated": "" }, props["children"] as ReactNode),
    },
    useSharedValue: (initial: number) => ({
      get: () => initial,
      set: (next: unknown) => state.sets.push(next),
    }),
    useAnimatedStyle: (worklet: () => unknown) => worklet(),
    useReducedMotion: () => state.reduced,
    withTiming: (to: number) => ({ timing: to }),
    withRepeat: (animation: unknown) => ({ repeat: animation }),
    cancelAnimation: () => undefined,
  };
});
vi.mock("#native/design-system-provider/use-design-system", () => ({
  useDesignSystem: () => ({ direction: "ltr" }),
}));
vi.mock("#native/heading/heading", async () => {
  const { createElement } = await import("react");
  return {
    Heading: (props: Record<string, unknown>) => {
      state.heading = props;
      return createElement("h2", null, props["children"] as ReactNode);
    },
  };
});
vi.mock("#native/text/text", async () => {
  const { createElement } = await import("react");
  return { Text: (props: { children: ReactNode }) => createElement("p", null, props.children) };
});
vi.mock("#native/surface/surface", async () => {
  const { createElement } = await import("react");
  return {
    Surface: (props: { children: ReactNode }) => createElement("section", null, props.children),
  };
});
vi.mock("#native/button/button", async () => {
  const { createElement } = await import("react");
  return {
    Button: (props: Record<string, unknown>) =>
      createElement(
        "button",
        { type: "button", onClick: props["onPress"] as () => void },
        props["children"] as ReactNode,
      ),
  };
});
vi.mock("#react/hooks/use-ui-text", () => ({
  useUiText:
    () =>
    (key: string, values?: Record<string, unknown>): string =>
      values === undefined ? key : `${key} ${JSON.stringify(values)}`,
}));

/** A target that measures at a fixed place. */
const target = (x: number, y: number): RefObject<View | null> => ({
  current: {
    measureInWindow: (callback: (x: number, y: number, w: number, h: number) => void) =>
      callback(x, y, 100, 40),
  } as unknown as View,
});

const STEPS = [
  {
    id: "scan",
    target: target(10, 100),
    title: "Scan items",
    description: "Point the camera at a barcode.",
  },
  { id: "pay", target: target(10, 700), title: "Take payment" },
];

describe("CoachMark (native)", () => {
  beforeEach(() => {
    state.reduced = false;
    state.sets = [];
    state.modal = undefined;
  });

  it("renders nothing while closed", () => {
    render(<CoachMark steps={STEPS} isOpen={false} />);
    expect(state.modal).toBeUndefined();
  });

  it("glides to the measured target, pulses, and titles the callout as a header with the count", () => {
    render(<CoachMark steps={STEPS} isOpen />);
    expect(state.modal?.["transparent"]).toBe(true);
    expect(state.sets).toContainEqual({ timing: 94 });
    expect(state.sets).toContainEqual({ repeat: { timing: 1 } });
    expect(state.heading["accessibilityRole"]).toBe("header");
    expect(screen.getByText("Scan items")).toBeTruthy();
    expect(screen.getByText(/progress \{"current":1,"total":2\}/)).toBeTruthy();
  });

  it("jumps and does not pulse under reduce motion", () => {
    state.reduced = true;
    render(<CoachMark steps={STEPS} isOpen />);
    expect(state.sets).toContain(94);
    expect(
      state.sets.some((set) => typeof set === "object" && set !== null && "repeat" in set),
    ).toBe(false);
  });

  it("walks the steps and finishes done", () => {
    const onFinish = vi.fn();
    const onOpenChange = vi.fn();
    render(<CoachMark steps={STEPS} defaultOpen onFinish={onFinish} onOpenChange={onOpenChange} />);
    fireEvent.click(screen.getByRole("button", { name: /\.next$/ }));
    expect(screen.getByText("Take payment")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /\.back$/ }));
    expect(screen.getByText("Scan items")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /\.next$/ }));
    fireEvent.click(screen.getByRole("button", { name: /\.done$/ }));
    expect(onFinish).toHaveBeenCalledWith("done");
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(screen.queryByText("Take payment")).toBeNull();
  });

  it("finishes skipped on Skip and on the Android back button", () => {
    const onFinish = vi.fn();
    const { unmount } = render(<CoachMark steps={STEPS} isOpen onFinish={onFinish} />);
    fireEvent.click(screen.getByRole("button", { name: /\.skip$/ }));
    expect(onFinish).toHaveBeenLastCalledWith("skipped");
    unmount();
    render(<CoachMark steps={STEPS} isOpen onFinish={onFinish} />);
    (state.modal?.["onRequestClose"] as (() => void) | undefined)?.();
    expect(onFinish).toHaveBeenCalledTimes(2);
  });
});
