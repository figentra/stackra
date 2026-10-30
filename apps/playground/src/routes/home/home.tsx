/**
 * Stackra file contract:
 * Purpose: the page of the index route, the playground's landing: this visit's rotating hero (`LandingHero`: the
 *          stack, the theme storm or the mirror, each with its h1, the ways in, browse or the Theme Studio, and the
 *          component count), the recently viewed row and the categories (`CategoryOverview`: swipeable
 *          shelves on a phone, group cards wider). The hero titles the document.
 * Boundary: presentation only over the registry and the `showcase` catalogue.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 3.2 (Home); ADR 0302 (decision 5); STA-1371;
 *          owner decision 2026-10-28 (three rotating heroes).
 */
import { Heading, useCatalogueText } from "@stackra/ui/react";

import { CategoryOverview } from "#src/components/category-overview";
import { LandingHero } from "#src/components/landing-hero";
import { RecentChips } from "#src/components/recent-chips";
import { MESSAGES } from "#src/constants/messages.constant";
import { SHOWCASE_KEYS } from "#src/constants/showcase-keys.constant";

/** The showcase keys. */
const K = SHOWCASE_KEYS.showcase;

/** The landing page: hero, recent and group cards. */
export function Home() {
  const t = useCatalogueText(MESSAGES.en);

  return (
    <article className="grid gap-16 pb-8">
      <LandingHero />

      <RecentChips />

      <section aria-labelledby="home-categories" className="grid grid-cols-[minmax(0,1fr)] gap-4">
        <Heading id="home-categories" level={2}>
          {t(K.home.categories)}
        </Heading>
        <CategoryOverview />
      </section>
    </article>
  );
}
