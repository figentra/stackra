/**
 * Stackra file contract:
 * Purpose: `randomizeKnobs`: new Theme Studio knobs drawn at random for every value not locked, within each knob's
 *          range, retried until the derived theme passes the contrast pairs (or the tries run out, when the last
 *          draw is kept).
 * Boundary: pure apart from the `random` source it is given; deriving and checking are @stackra/tokens'.
 * Runtime: browser
 * Governing contract: ADR 0501 (section 5: the Theme Studio).
 */
import { checkTheme, deriveTheme } from "@stackra/tokens";
import type { Theme } from "@stackra/tokens/contracts";

import type { StudioKnobs } from "#src/components/studio-controls";

/** How many draws to try for one that keeps every contrast pair. */
const TRIES = 12;

const STRENGTHS = ["none", "subtle", "medium", "strong"] as const;

/** A number between `min` and `max`, on `step`. */
const between = (random: () => number, min: number, max: number, step: number) =>
  Math.round((min + random() * (max - min)) / step) * step;

/** One draw of every knob Randomize moves. */
function draw(random: () => number): StudioKnobs {
  const pick = <T>(values: readonly T[]) => values[Math.floor(random() * values.length)] as T;
  return {
    accent: { hue: between(random, 0, 359, 1), chroma: between(random, 0.04, 0.18, 0.01) },
    neutralTint: between(random, 0, 0.8, 0.05),
    radius: between(random, 0, 14, 1),
    pillControls: random() < 0.4,
    formsRadius: between(random, 0.5, 2, 0.25),
    spacing: between(random, 3.6, 4.4, 0.1),
    fontScale: between(random, 0.95, 1.05, 0.05),
    lineHeight: between(random, 0.95, 1.1, 0.05),
    fieldStyle: random() < 0.5 ? "bordered" : "lifted",
    shadows: { surface: pick(STRENGTHS), overlay: pick(STRENGTHS), field: pick(STRENGTHS) },
  };
}

/**
 * New knobs: a fresh draw for every knob not in `locks`, the current value for every locked one.
 * @param base - the theme the knobs apply to
 * @param knobs - the knobs on screen
 * @param locks - the knob names to keep
 * @param random - the random source, `Math.random` by default
 */
export function randomizeKnobs(
  base: Theme,
  knobs: StudioKnobs,
  locks: readonly string[],
  random: () => number = Math.random,
): StudioKnobs {
  let next = knobs;
  for (let attempt = 0; attempt < TRIES; attempt += 1) {
    const fresh = draw(random);
    next = {
      ...knobs,
      ...Object.fromEntries(Object.entries(fresh).filter(([name]) => !locks.includes(name))),
    };
    try {
      const failing = checkTheme(deriveTheme(base, next)).filter(
        ({ code }) => code !== "hex_drift",
      );
      if (failing.length === 0) return next;
    } catch {
      // An unusable draw: try again.
    }
  }
  return next;
}
