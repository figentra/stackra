/**
 * Stackra file contract:
 * Purpose: `useHeroChoice`, the landing hero's id for this launch, re-rendering when the Display menu or a link
 *          switches it.
 * Boundary: a React hook over `heroChoice`.
 * Runtime: react-native
 * Governing contract: owner decision 2026-10-28 (rotating landing heroes); STA-1371.
 */
import { useSyncExternalStore } from "react";

import { heroChoice } from "./hero-choice.store";

/** The landing hero's id, or `undefined` when none is running. */
export function useHeroChoice(): string | undefined {
  return useSyncExternalStore(heroChoice.subscribe, heroChoice.getSnapshot);
}
