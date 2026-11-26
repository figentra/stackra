/**
 * Stackra file contract:
 * Purpose: proves `useFloorSteps` draws everything when it does not play, rewinds at full motion and waits for the
 *          element to come into view at its threshold, then counts one step per floor step and holds on the last;
 *          and that dropping below full motion mid-play draws everything again.
 * Boundary: jsdom; `IntersectionObserver` is a stand-in the test fires by hand; fake timers, one act per step so each
 *           step's effect schedules the next; `useReducedMotion` is stubbed.
 * Runtime: browser
 * Governing contract: ADR 0022 (test placement); motion principles (the `floor` motion step); STA-2041.
 */
// @vitest-environment jsdom
import { motionTiming, STACKRA_THEME } from "@stackra/tokens";
import { act, renderHook } from "@testing-library/react";

import { useFloorSteps } from "#react/hooks/use-floor-steps";

/** The theme's floor step, the hook's default: one step a count. */
const STEP_MS = motionTiming(STACKRA_THEME, "floor").durationMs;

const state = vi.hoisted(() => ({ isReduced: false }));
vi.mock("motion/react", async (load) => ({
  ...(await load<object>()),
  useReducedMotion: () => state.isReduced,
}));

let fire: (entries: { isIntersecting: boolean }[]) => void = () => {};
let threshold: number | undefined;

/** The hook over a real element. */
const play = (isEnabled = true) => {
  const element = { current: document.createElement("div") };
  return renderHook(({ total }) => useFloorSteps(element, { total, isEnabled, threshold: 0.4 }), {
    initialProps: { total: 3 },
  });
};

describe("useFloorSteps", () => {
  beforeEach(() => {
    state.isReduced = false;
    vi.useFakeTimers();
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        constructor(callback: typeof fire, options?: { threshold?: number }) {
          fire = callback;
          threshold = options?.threshold;
        }

        observe() {}

        disconnect() {}
      },
    );
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("draws everything when it does not play", () => {
    expect(play(false).result.current).toBe(Number.POSITIVE_INFINITY);
    state.isReduced = true;
    expect(play().result.current).toBe(Number.POSITIVE_INFINITY);
  });

  it("waits for the view, then counts one step per floor step and holds on the last", () => {
    const { result } = play();
    expect(result.current).toBe(0);
    expect(threshold).toBe(0.4);
    act(() => vi.advanceTimersByTime(5 * STEP_MS));
    expect(result.current).toBe(0);
    act(() => fire([{ isIntersecting: true }]));
    for (const count of [1, 2, 3, 3]) {
      act(() => vi.advanceTimersByTime(STEP_MS));
      expect(result.current).toBe(count);
    }
  });

  it("draws everything again when motion drops mid-play", () => {
    const { result, rerender } = play();
    act(() => fire([{ isIntersecting: true }]));
    act(() => vi.advanceTimersByTime(STEP_MS));
    expect(result.current).toBe(1);
    state.isReduced = true;
    rerender({ total: 3 });
    expect(result.current).toBe(Number.POSITIVE_INFINITY);
  });
});
