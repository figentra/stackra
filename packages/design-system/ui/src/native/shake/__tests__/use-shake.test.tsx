/**
 * Stackra file contract:
 * Purpose: proves the native useShake: its style follows the offset, and `shake()` plays the five-leg sequence unless
 *          the system asks for reduced motion, when it does nothing.
 * Boundary: Reanimated does not run in vitest, so it is a recording stand-in; the hook runs under renderHook.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); WCAG 2.2 SC 2.3.3; ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { renderHook } from "@testing-library/react";

import type { Shake } from "#native/shake/shake.type";
import { useShake } from "#native/shake/use-shake";

const state = vi.hoisted(() => ({ reduced: false, sets: [] as unknown[] }));

vi.mock("react-native-reanimated", () => ({
  useSharedValue: (initial: number) => ({
    value: initial,
    set: (next: unknown) => state.sets.push(next),
  }),
  useAnimatedStyle: (worklet: () => unknown) => worklet(),
  useReducedMotion: () => state.reduced,
  withTiming: (to: number) => to,
  withSequence: (...steps: unknown[]) => steps,
}));

/** Runs the hook and hands back what it returned. */
const probe = (): Shake => renderHook(() => useShake()).result.current;

beforeEach(() => {
  state.reduced = false;
  state.sets.length = 0;
});

describe("useShake (native)", () => {
  it("styles the offset and plays the shake", () => {
    const { style, shake } = probe();
    expect(style).toEqual({ transform: [{ translateX: 0 }] });
    shake();
    expect(state.sets).toEqual([[-10, 10, -6, 6, 0]]);
  });

  it("does nothing under reduced motion", () => {
    state.reduced = true;
    probe().shake();
    expect(state.sets).toEqual([]);
  });
});
