/**
 * Stackra file contract:
 * Purpose: `useVisitHero`, the id of this visit's landing hero (`visitHero`), following the Display menu's picks
 *          (`chooseHero`) live.
 * Boundary: reads once per mount, then listens for `HERO_VISIT.event` on the window. A `?hero=` is dropped from the
 *           URL once read: the visit keeps it, and the links that carry the search params would otherwise pin it.
 * Runtime: browser
 * Governing contract: owner decision 2026-10-28 (a random first hero, then each return visit the next in turn).
 */
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";

import { HERO_VISIT } from "./hero-visit.constant";
import { visitHero } from "./visit-hero.function";

/** This visit's hero id. */
export function useVisitHero(): string {
  const [id, setId] = useState(() => visitHero());
  const [search, setSearch] = useSearchParams();
  useEffect(() => {
    if (!search.has("hero")) return;
    const rest = new URLSearchParams(search);
    rest.delete("hero");
    setSearch(rest, { replace: true });
  }, [search, setSearch]);
  useEffect(() => {
    const onPick = (event: Event) => setId((event as CustomEvent<string>).detail);
    window.addEventListener(HERO_VISIT.event, onPick);
    return () => window.removeEventListener(HERO_VISIT.event, onPick);
  }, []);
  return id;
}
