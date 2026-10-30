/**
 * Stackra file contract:
 * Purpose: the components index (HeroUI's `components/index` shape): for one category its hero and pillars (STA-1371);
 *          the sticky category rail on top (the header's search, ⌘K, finds a component, so the page has no filter of its own);
 *          under them, for All, one `CategoryShelf` per category (a swipeable row on a phone, two then three per row
 *          wider), each card loading its demo only as it nears the viewport; for one category, that category's
 *          cards one, two or three per row. No block skips its layout (`content-visibility`): a skipped block keeps a guessed
 *          height while its cards overflow it, onto the next block.
 * Boundary: presentation over the registry and the `showcase` catalogue; the URL (`/components[/:category]`) is the
 *           selected tab, so a link opens the same view. An unknown category segment reads as All.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) sections 3.1, 3.2 and 5; ADR 0302 (decision 5).
 */
import {
  byCategory,
  CATEGORIES,
  categoryFromSegment,
  categoryKeys,
  type ComponentCategory,
} from "@stackra/showcase";
import type { I18nKey } from "@stackra/i18n";
import { Heading, useCatalogueText } from "@stackra/ui/react";
import { useParams } from "react-router";

import { CategoryShelf } from "#src/components/category-shelf";
import { CategoryTabs } from "#src/components/category-tabs";
import { CategoryHero } from "#src/components/doc-page/category-hero";
import { MESSAGES } from "#src/constants/messages.constant";
import { SHOWCASE_KEYS } from "#src/constants/showcase-keys.constant";

/** The showcase keys. */
const K = SHOWCASE_KEYS.showcase;

/** The components index page. */
export function Components() {
  const t = useCatalogueText(MESSAGES.en);
  const params = useParams();
  const category = params["category"] ? categoryFromSegment(params["category"]) : undefined;
  const shown = (
    CATEGORIES.map(({ id }) => id).filter(
      (id) => !category || id === category,
    ) as ComponentCategory[]
  )
    .map((id) => ({
      id,
      entries: byCategory(id),
    }))
    .filter(({ entries }) => entries.length > 0);
  const title = category ? t(categoryKeys(category).title as I18nKey) : t(K.ui.components);

  return (
    <article className="grid grid-cols-[minmax(0,1fr)] gap-10">
      <title>{title}</title>
      {category ? (
        <CategoryHero category={category} />
      ) : (
        <Heading level={1} className="sr-only">
          {title}
        </Heading>
      )}
      <CategoryTabs category={category} />
      {shown.map(({ id, entries }) => (
        <CategoryShelf key={id} category={id} entries={entries} isAlone={category !== undefined} />
      ))}
    </article>
  );
}
