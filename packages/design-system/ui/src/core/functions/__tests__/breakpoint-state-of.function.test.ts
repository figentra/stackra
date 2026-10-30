/**
 * Stackra file contract:
 * Purpose: proves `breakpointStateOf` gives each width its widest breakpoint and size class at Tailwind's edges, and
 *          the same frozen object for every width within one breakpoint.
 * Boundary: pure function.
 * Runtime: node
 * Governing contract: design-system gap inventory row 20 (owner choice "P1 + P2 core", 2026-10-28); ADR 0022.
 */
import { breakpointStateOf } from "#core/functions/breakpoint-state-of.function";

describe("breakpointStateOf", () => {
  it.each([
    [0, undefined, "phone"],
    [639, undefined, "phone"],
    [640, "sm", "phone"],
    [767, "sm", "phone"],
    [768, "md", "tablet"],
    [1023, "md", "tablet"],
    [1024, "lg", "desktop"],
    [1280, "xl", "desktop"],
    [2560, "xl", "desktop"],
  ] as const)("%i is %s, a %s", (width, breakpoint, sizeClass) => {
    expect(breakpointStateOf(width)).toEqual({ breakpoint, sizeClass });
  });

  it("is the same frozen object within a breakpoint", () => {
    expect(breakpointStateOf(800)).toBe(breakpointStateOf(1000));
    expect(Object.isFrozen(breakpointStateOf(800))).toBe(true);
  });
});
