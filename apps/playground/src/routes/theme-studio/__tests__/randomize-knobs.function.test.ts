/**
 * Stackra file contract:
 * Purpose: proves Randomize keeps every locked knob, moves the unlocked ones within their ranges and returns knobs
 *          the theme derives from.
 * Boundary: pure; a seeded random source.
 * Runtime: node
 * Governing contract: ADR 0501 (section 5); ADR 0022 (test placement).
 */
import { deriveTheme, STACKRA_THEME } from "@stackra/tokens";

import { randomizeKnobs } from "#src/routes/theme-studio/randomize-knobs.function";

/** A repeatable random source. */
const seeded = (seed: number) => () => {
  seed = (seed * 16_807) % 2_147_483_647;
  return (seed - 1) / 2_147_483_646;
};

describe("randomizeKnobs", () => {
  it("keeps the locked knobs and draws the rest within their ranges", () => {
    const knobs = { radius: 6, accent: { hue: 10, chroma: 0.1 } };
    const next = randomizeKnobs(STACKRA_THEME, knobs, ["radius"], seeded(7));
    expect(next.radius).toBe(6);
    expect(next.accent).not.toEqual(knobs.accent);
    expect(next.spacing).toBeGreaterThanOrEqual(3.6);
    expect(next.spacing).toBeLessThanOrEqual(4.4);
    expect(() => deriveTheme(STACKRA_THEME, next)).not.toThrow();
  });
});
