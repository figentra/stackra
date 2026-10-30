/**
 * Stackra file contract:
 * Purpose: proves the native Shimmer names itself with its words in a polite region, draws them as platform Text,
 *          sweeps a window over a hidden full-colour copy from the start of the reading direction (left in English,
 *          right in Arabic), stands still under reduced motion, and draws the block kind as Skeleton lines.
 * Boundary: React Native, Reanimated, Text, SkeletonGroup and Skeleton are recording stand-ins (a shared value records
 *           what it is set to).
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement); STA-1371 (wave D, owner approval 2026-10-30).
 */
// @vitest-environment jsdom
import { act, render } from "@testing-library/react";

import { Shimmer } from "#native/shimmer/shimmer";

const state = vi.hoisted(() => ({
  reduced: false,
  direction: "ltr",
  views: [] as Record<string, unknown>[],
  texts: [] as Record<string, unknown>[],
  windows: 0,
  sets: [] as unknown[],
  bones: [] as Record<string, unknown>[],
  groups: [] as Record<string, unknown>[],
}));

vi.mock("react-native", async () => {
  const { createElement } = await import("react");
  return {
    View: (props: Record<string, unknown>) => {
      state.views.push(props);
      return createElement("div", null, props["children"] as never);
    },
  };
});
vi.mock("react-native-reanimated", async () => {
  const { createElement } = await import("react");
  return {
    default: {
      View: (props: Record<string, unknown>) => {
        state.windows += 1;
        return createElement("div", null, props["children"] as never);
      },
    },
    cancelAnimation: () => undefined,
    Easing: { linear: "linear" },
    useAnimatedStyle: (worklet: () => unknown) => worklet(),
    useReducedMotion: () => state.reduced,
    useSharedValue: (initial: number) => ({
      get: () => initial,
      set: (next: unknown) => state.sets.push(next),
    }),
    withRepeat: (animation: unknown) => animation,
    withTiming: (to: number) => ({ to }),
  };
});
vi.mock("#native/design-system-provider/use-design-system", () => ({
  useDesignSystem: () => ({ direction: state.direction }),
}));
vi.mock("#native/text/text", async () => {
  const { createElement } = await import("react");
  return {
    Text: (props: Record<string, unknown>) => {
      state.texts.push(props);
      return createElement("span", null, props["children"] as never);
    },
  };
});
vi.mock("#native/skeleton-group/skeleton-group", async () => {
  const { createElement } = await import("react");
  return {
    SkeletonGroup: (props: Record<string, unknown>) => {
      state.groups.push(props);
      return createElement("div", null, props["children"] as never);
    },
  };
});
vi.mock("#native/skeleton/skeleton", () => ({
  Skeleton: (props: Record<string, unknown>) => {
    state.bones.push(props);
    return null;
  },
}));

/** Lays the base text out at 200 points wide. */
const layOut = () =>
  act(() =>
    (state.texts[0]?.["onLayout"] as (event: unknown) => void)?.({
      nativeEvent: { layout: { width: 200 } },
    }),
  );

describe("Shimmer (native)", () => {
  beforeEach(() => {
    state.reduced = false;
    state.direction = "ltr";
    state.views = [];
    state.texts = [];
    state.windows = 0;
    state.sets = [];
    state.bones = [];
    state.groups = [];
  });

  it("names itself politely and sweeps a window from the left in English", () => {
    render(<Shimmer />);
    expect(state.views[0]).toMatchObject({
      accessibilityLabel: "Thinking…",
      accessibilityLiveRegion: "polite",
    });
    expect(state.texts[0]).toMatchObject({ tone: "muted", children: "Thinking…" });
    layOut();
    expect(state.sets).toEqual([-80, { to: 200 }]);
    expect(state.windows).toBeGreaterThan(0);
  });

  it("sweeps from the right in Arabic", () => {
    state.direction = "rtl";
    render(<Shimmer>جارٍ البحث</Shimmer>);
    layOut();
    expect(state.sets).toEqual([200, { to: -80 }]);
  });

  it("stands still under reduced motion", () => {
    state.reduced = true;
    render(<Shimmer />);
    layOut();
    expect(state.sets).toEqual([]);
    expect(state.windows).toBe(0);
  });

  it("draws the block kind as skeleton lines under a named group", () => {
    render(<Shimmer kind="block" lines={2} />);
    expect(state.groups[0]).toMatchObject({ loadingLabel: "Thinking…" });
    expect(state.bones).toHaveLength(2);
    expect(String(state.bones[1]?.["className"])).toContain("w-3/5");
  });
});
