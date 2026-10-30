/**
 * Stackra file contract:
 * Purpose: `heroChoice`, the showcase home's landing hero for this launch: picked once, on first read, by `pickHero`
 *          (the hero after the one remembered from the last launch, else a random one) and remembered in
 *          `displayPrefs` as the next launch's `last`; `set` switches it (the Display menu, a `?hero=` link).
 * Boundary: module state with a subscribe/getSnapshot pair for `useSyncExternalStore`; an id not in `HEROES` is
 *           ignored.
 * Runtime: react-native
 * Governing contract: owner decision 2026-10-28 (rotating landing heroes); ADR 0256 (client storage); STA-1371.
 */
import { pickHero } from "@stackra/showcase";

import { HEROES } from "../constants/heroes.constant";
import { displayPrefs } from "./display-prefs.store";

let hero: string | undefined;
const listeners = new Set<() => void>();

/** The landing hero of this launch. */
export const heroChoice = {
  /** The hero's id, picked on the first call and kept for the rest of the launch. */
  getSnapshot(): string | undefined {
    if (hero === undefined) {
      hero = pickHero({
        heroes: HEROES,
        now: new Date(),
        random: Math.random(),
        last: displayPrefs.get("hero"),
      });
      if (hero !== undefined) displayPrefs.set("hero", hero);
    }
    return hero;
  },
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => void listeners.delete(listener);
  },
  /** Shows `id` from now on and remembers it as the last hero seen; an unknown id changes nothing. */
  set(id: string) {
    if (id === hero || !HEROES.some((entry) => entry.id === id)) return;
    hero = id;
    displayPrefs.set("hero", id);
    for (const listener of listeners) listener();
  },
};
