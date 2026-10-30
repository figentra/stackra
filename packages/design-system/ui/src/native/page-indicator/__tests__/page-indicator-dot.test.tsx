/**
 * Stackra file contract:
 * Purpose: proves the native PageIndicatorDot is 20 points wide and in the foreground colour when current, 8 points
 *          and muted otherwise, and moves between the widths over 200 ms, jumping at once under Reduce Motion.
 * Boundary: Reanimated is a recording stand-in: the shared value records what it is set to, `withTiming` returns a
 *           tagged target, and the animated style's worklet is run by hand.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); ADR 0329 (motion); ADR 0022 (test placement); STA-1371.
 */
// @vitest-environment jsdom
import { render } from "@testing-library/react";

import { PageIndicatorDot } from "#native/page-indicator/page-indicator-dot";

const state = vi.hoisted(() => ({
  isReduced: false,
  sets: [] as unknown[],
  views: [] as Record<string, unknown>[],
  style: undefined as (() => { width: unknown }) | undefined,
}));

vi.mock("react-native-reanimated", async () => {
  const { useRef } = await import("react");
  return {
    default: {
      View: (props: Record<string, unknown>) => {
        state.views.push(props);
        return null;
      },
    },
    useReducedMotion: () => state.isReduced,
    useSharedValue: (initial: unknown) => {
      const ref = useRef({ value: initial });
      return {
        get: () => ref.current.value,
        set: (next: unknown) => {
          state.sets.push(next);
          ref.current.value = next;
        },
      };
    },
    useAnimatedStyle: (style: () => { width: unknown }) => {
      state.style = style;
      return {};
    },
    withTiming: (to: number, config: { duration: number }) => ({ to, ...config }),
  };
});

describe("PageIndicatorDot (native)", () => {
  beforeEach(() => {
    state.isReduced = false;
    state.sets = [];
    state.views = [];
  });

  it("stretches the current dot and animates the change", () => {
    const { rerender } = render(<PageIndicatorDot isCurrent />);
    expect(state.style?.()).toEqual({ width: { to: 20, duration: 200 } });
    expect(String(state.views.at(-1)?.["className"])).toContain("bg-foreground");
    rerender(<PageIndicatorDot isCurrent={false} />);
    expect(state.sets.at(-1)).toEqual({ to: 8, duration: 200 });
    expect(String(state.views.at(-1)?.["className"])).toContain("bg-default");
  });

  it("jumps to the width under Reduce Motion", () => {
    state.isReduced = true;
    render(<PageIndicatorDot isCurrent={false} />);
    expect(state.sets).toEqual([8]);
    expect(state.style?.()).toEqual({ width: 8 });
  });
});
