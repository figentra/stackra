/**
 * Stackra file contract:
 * Purpose: `LandingHero`, the index page's hero: this visit's pick among `HEROES` (`useVisitHero`), loaded on demand,
 *          so a visit downloads only its own hero. Until the chunk arrives it holds the hero's room and the page's
 *          title.
 * Boundary: choosing and loading only; each hero draws itself, its h1 and its title.
 * Runtime: browser
 * Governing contract: owner decision 2026-10-28 (three rotating heroes); STA-1371.
 */
import { Suspense } from "react";

import { HEROES } from "#src/constants/heroes.constant";
import { HomeRoute } from "#src/routes/home/home.route";

import { useVisitHero } from "./use-visit-hero";

/** The landing hero of this visit. */
export function LandingHero() {
  const id = useVisitHero();
  const hero = HEROES.find((candidate) => candidate.id === id) ?? HEROES[0];
  if (!hero) return null;
  return (
    <Suspense
      fallback={
        <div className="min-h-[36rem]">
          <title>{HomeRoute.title}</title>
        </div>
      }
    >
      <hero.Component />
    </Suspense>
  );
}
