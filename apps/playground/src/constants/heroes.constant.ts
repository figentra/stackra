/**
 * Stackra file contract:
 * Purpose: `HEROES`, the landing heroes in rotation order, each id with its lazily loaded component: the stack
 *          (`stack`), the theme storm (`storm`) and the mirror (`mirror`).
 * Boundary: data only; `pickHero` (@stackra/showcase) reads the entries, `LandingHero` draws the picked one, and a
 *           visit downloads only that hero's chunk.
 * Runtime: browser
 * Governing contract: owner decision 2026-10-28 (three rotating heroes); STA-1371.
 */
import type { HeroEntry } from "@stackra/showcase";
import { type ComponentType, lazy, type LazyExoticComponent } from "react";

/** The heroes, in turn: a returning visitor sees the next one. */
export const HEROES: readonly (HeroEntry & {
  readonly Component: LazyExoticComponent<ComponentType>;
})[] = [
  {
    id: "stack",
    Component: lazy(() =>
      import("#src/components/hero-stack").then(({ HeroStack }) => ({ default: HeroStack })),
    ),
  },
  {
    id: "storm",
    Component: lazy(() =>
      import("#src/components/hero-storm").then(({ HeroStorm }) => ({ default: HeroStorm })),
    ),
  },
  {
    id: "mirror",
    Component: lazy(() =>
      import("#src/components/hero-mirror").then(({ HeroMirror }) => ({ default: HeroMirror })),
    ),
  },
];
