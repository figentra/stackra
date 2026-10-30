/**
 * Stackra file contract:
 * Purpose: `PickHeroInput`, what `pickHero` decides from: the heroes, today, a random number, the visitor's last hero
 *          and a hero asked for by id.
 * Boundary: a type only, in its own file. The app supplies the clock, the random number and its own storage.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (one declaration per file); owner decision 2026-10-28 (rotating landing heroes).
 */
import type { HeroEntry } from "#src/types/hero-entry.type";

/** The input of `pickHero`. */
export interface PickHeroInput {
  /** The heroes, in rotation order. */
  readonly heroes: readonly HeroEntry[];
  /** Today, for the heroes' dates. */
  readonly now: Date;
  /** A number from 0 up to 1 (`Math.random()` in the app, fixed in a test). */
  readonly random: number;
  /** The hero this visitor saw on their last visit, if the device remembers one. */
  readonly last?: string | undefined;
  /** A hero asked for by id (`?hero=`, the Display menu); it wins when it is in the list, whatever its weight or dates. */
  readonly override?: string | undefined;
}
