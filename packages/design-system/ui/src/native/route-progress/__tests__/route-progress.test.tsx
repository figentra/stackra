/**
 * Stackra file contract:
 * Purpose: proves the native RouteProgress draws nothing while idle, is a named busy progressbar that animates its
 *          fill from 8% while loading, sets the fill and fade without timing under reduced motion, and leaves after the
 *          fade once loading stops.
 * Boundary: React Native, Reanimated and HeroUI Native are stand-ins; fake timers drive the shared trickle hook.
 * Runtime: node
 * Governing contract: gap inventory row 29 (owner approval 2026-10-28); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { act, render } from "@testing-library/react";

import { RouteProgress } from "#native/route-progress/route-progress";

const state = vi.hoisted(() => ({
  reduced: false,
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
    useReducedMotion: () => state.reduced,
    withTiming: (to: number) => ({ timing: to }),
  };
});

vi.mock("heroui-native", () => ({ useThemeColor: (name: string) => `color:${name}` }));

describe("RouteProgress (native)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    state.reduced = false;
    state.sets = [];
    state.views = [];
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("is idle, then a named busy bar that trickles, then fades and leaves", () => {
    const { rerender } = render(<RouteProgress isLoading={false} />);
    expect(state.views).toEqual([]);
    rerender(<RouteProgress isLoading />);
    const track = state.views.at(-2) ?? {};
    expect(track).toMatchObject({
      accessibilityRole: "progressbar",
      accessibilityLabel: "Loading page",
      accessibilityState: { busy: true },
      pointerEvents: "none",
    });
    expect(state.sets).toContainEqual({ timing: expect.closeTo(0.08) });
    rerender(<RouteProgress isLoading={false} />);
    expect(state.sets).toContainEqual({ timing: 1 });
    expect(state.sets).toContainEqual({ timing: 0 });
    state.views = [];
    act(() => vi.advanceTimersByTime(300));
    expect(state.views).toEqual([]);
  });

  it("sets the fill without timing under reduced motion", () => {
    state.reduced = true;
    render(<RouteProgress isLoading label="Opening the till" />);
    expect(state.sets).toContain(0.9);
    expect(state.sets).not.toContainEqual(expect.objectContaining({ timing: expect.anything() }));
    expect(state.views[0]).toMatchObject({ accessibilityLabel: "Opening the till" });
  });
});
