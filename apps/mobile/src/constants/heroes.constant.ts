/**
 * Stackra file contract:
 * Purpose: `HEROES`, the landing heroes the showcase home rotates through, in turn order: "stack" (tokens, components,
 *          products as three floating layers), "storm" (one system re-themed brand after brand) and "mirror" (English
 *          and Arabic, flipping). `pickHero` chooses among them once per launch.
 * Boundary: data only; the components are `components/heroes/`, the choice `stores/hero-choice.store.ts`.
 * Runtime: react-native
 * Governing contract: owner decision 2026-10-28 (rotating landing heroes); STA-1371.
 */
import type { HeroEntry } from "@stackra/showcase";

/** The heroes in rotation, in the order a returning visitor sees them. */
export const HEROES = [
  { id: "stack" },
  { id: "storm" },
  { id: "mirror" },
] as const satisfies readonly HeroEntry[];
