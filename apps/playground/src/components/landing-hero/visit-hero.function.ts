/**
 * Stackra file contract:
 * Purpose: `visitHero`, this visit's landing hero: `?hero=<id>` when it names one, else the one this visit already
 *          showed (sessionStorage), else `pickHero`'s pick after the device's last hero (localStorage). The answer is
 *          kept as this visit's hero and as the next visit's `last`.
 * Boundary: the two storages, each access guarded: a browser that refuses storage gets a random pick.
 * Runtime: browser
 * Governing contract: owner decision 2026-10-28 (a random first hero, then each return visit the next in turn).
 */
import { pickHero } from "@stackra/showcase";

import { HEROES } from "#src/constants/heroes.constant";

import { HERO_VISIT } from "./hero-visit.constant";
import { keepHero } from "./keep-hero.function";

/** A stored value, or undefined when there is none or the storage refuses. */
const read = (storage: () => Storage, key: string) => {
  try {
    return storage().getItem(key) ?? undefined;
  } catch {
    return undefined;
  }
};

/** Whether `id` names a hero. */
const known = (id: string | undefined) => HEROES.some((hero) => hero.id === id);

/** The id of this visit's hero. */
export function visitHero(search = location.search, random = Math.random(), now = new Date()) {
  const asked = new URLSearchParams(search).get("hero") ?? undefined;
  const kept = read(() => sessionStorage, HERO_VISIT.session);
  if (!known(asked) && kept !== undefined && known(kept)) return kept;
  const last = read(() => localStorage, HERO_VISIT.last);
  const id =
    pickHero({ heroes: HEROES, now, random, last, override: asked }) ?? HEROES[0]?.id ?? "";
  keepHero(id);
  return id;
}
