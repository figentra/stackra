/**
 * Stackra file contract:
 * Purpose: proves the native RouteProgress draws nothing while idle, is a named busy progressbar whose row of 96 dots
 *          of 2 pt starts 8% lit and trickles forward while loading, fills every dot and fades once loading stops, then
 *          leaves after the fade, and holds a still row with no fade timing under reduced motion.
 * Boundary: React Native, Reanimated, HeroUI Native, the provider and the motion level are stand-ins (a dot carries
 *           its style as data); fake timers drive the shared trickle hook.
 * Runtime: node
 * Governing contract: gap inventory row 29 (owner approval 2026-10-28); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
// @covers sta-2017:FR-005
import { act, render } from "@testing-library/react";

import { RouteProgress } from "#native/route-progress/route-progress";

const state = vi.hoisted(() => ({
  motion: "full",
  sets: [] as unknown[],
  views: [] as Record<string, unknown>[],
}));

vi.mock("react-native-reanimated", async () => {
  const { createElement, useRef } = await import("react");
  return {
    default: {
      View: (props: Record<string, unknown>) => {
        state.views.push(props);
        return createElement("div", null, props["children"] as never);
      },
    },
    useSharedValue: (initial: unknown) => {
      const ref = useRef<{ get: () => unknown; set: (next: unknown) => void } | null>(null);
      if (!ref.current) {
        let value = initial;
        ref.current = {
          get: () => (typeof value === "number" ? value : 0),
          set: (next) => {
            value = next;
            state.sets.push(next);
          },
        };
      }
      return ref.current;
    },
    useAnimatedStyle: (worklet: () => unknown) => worklet(),
    withTiming: (to: number) => ({ timing: to }),
  };
});

vi.mock("heroui-native", () => ({ useThemeColor: (name: string) => `color:${name}` }));

vi.mock("react-native", async () => {
  const { createElement } = await import("react");
  return {
    View: (props: Record<string, unknown>) => {
      const style = props["style"] as Record<string, unknown> | undefined;
      // A dot is the only view with a plain style that carries a colour.
      const isDot = style !== undefined && !Array.isArray(style) && "backgroundColor" in style;
      return createElement(
        "div",
        isDot ? { "data-dot": JSON.stringify(style) } : null,
        props["children"] as never,
      );
    },
  };
});

vi.mock("#native/design-system-provider/use-design-system", () => ({
  useDesignSystem: () => ({ locale: "en", direction: "ltr" }),
}));

vi.mock("#native/design-system-provider/use-motion", () => ({ useMotion: () => state.motion }));

interface DotStyle {
  width: number;
  height: number;
  backgroundColor: string;
  opacity: number;
}

const dotsOf = (container: HTMLElement) =>
  [...container.querySelectorAll<HTMLElement>("[data-dot]")].map(
    (node) => JSON.parse(node.dataset["dot"] ?? "{}") as DotStyle,
  );
const litOf = (container: HTMLElement) =>
  dotsOf(container).filter((dot) => dot.opacity === 1).length;

describe("RouteProgress (native)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    state.motion = "full";
    state.sets = [];
    state.views = [];
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("is idle, then a named busy bar that trickles, then fades and leaves", () => {
    const { container, rerender } = render(<RouteProgress isLoading={false} />);
    expect(state.views).toEqual([]);
    rerender(<RouteProgress isLoading />);
    const track = state.views.at(-1) ?? {};
    expect(track).toMatchObject({
      accessibilityRole: "progressbar",
      accessibilityLabel: "Loading page",
      accessibilityState: { busy: true },
      pointerEvents: "none",
    });
    expect(state.sets).toContainEqual({ timing: 1 });
    // 8% of 96 dots, rounded up, in the accent at 2 pt.
    expect(dotsOf(container)).toHaveLength(96);
    expect(litOf(container)).toBe(8);
    expect(dotsOf(container)[0]).toMatchObject({
      width: 2,
      height: 2,
      backgroundColor: "color:accent",
    });
    act(() => vi.advanceTimersByTime(250 * 40));
    expect(litOf(container)).toBeGreaterThan(0.8 * 96);
    expect(litOf(container)).toBeLessThan(0.9 * 96);
    rerender(<RouteProgress isLoading={false} />);
    expect(litOf(container)).toBe(96);
    expect(state.sets.at(-1)).toEqual({ timing: 0 });
    state.views = [];
    act(() => vi.advanceTimersByTime(300));
    expect(state.views).toEqual([]);
  });

  // @covers sta-2017:FR-007
  it.each(["reduced", "none"])(
    "holds a still row and sets the fade without timing when motion is %s",
    (level) => {
      state.motion = level;
      const { container } = render(<RouteProgress isLoading label="Opening the till" />);
      // The still fill is 90%: 87 of 96 dots, rounded up.
      expect(litOf(container)).toBe(87);
      act(() => vi.advanceTimersByTime(250 * 4));
      expect(litOf(container)).toBe(87);
      expect(state.sets).toContain(1);
      expect(state.sets).not.toContainEqual(expect.objectContaining({ timing: expect.anything() }));
      expect(state.views[0]).toMatchObject({ accessibilityLabel: "Opening the till" });
    },
  );
});
