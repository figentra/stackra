/**
 * Stackra file contract:
 * Purpose: proves the theme transition defaults to a circle from the tapped point, uses that point once, and falls
 *          back to Fade (never to a moving preset) while Reduce Motion is on.
 * Boundary: the store alone; React Native's AccessibilityInfo and Uniwind's preset enum are stand-ins.
 * Runtime: node
 * Governing contract: ADR 0320 (the Theme Studio); ADR 0022 (test placement); WCAG 2.2 SC 2.3.3.
 */
import { describe, expect, it, vi } from "vitest";

const reduceMotion = vi.hoisted(() => ({ listener: (_isOn: boolean) => {} }));
vi.mock("react-native", () => ({
  AccessibilityInfo: {
    isReduceMotionEnabled: () => Promise.resolve(false),
    addEventListener: (_event: string, listener: (isOn: boolean) => void) => {
      reduceMotion.listener = listener;
    },
  },
}));
vi.mock("uniwind", () => ({ ThemeTransitionPreset: { None: 0, Fade: 1, CircleFromOrigin: 12 } }));

const { themeTransition } = await import("../theme-transition.store");

describe("themeTransition", () => {
  it("draws a circle from the tapped point, once", () => {
    themeTransition.setOrigin({ x: 10, y: 20 });
    expect(themeTransition.take()).toEqual({ preset: 12, origin: { x: 10, y: 20 } });
    expect(themeTransition.take()).toEqual({ preset: 12, origin: undefined });
  });

  it("fades under Reduce Motion and keeps None as none", () => {
    reduceMotion.listener(true);
    expect(themeTransition.take().preset).toBe(1);
    themeTransition.setPreset(0);
    expect(themeTransition.take().preset).toBe(0);
    reduceMotion.listener(false);
  });
});
