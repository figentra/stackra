/**
 * Stackra file contract:
 * Purpose: the group card of a category on the home page (tablet and desktop): its glyph, title and count, one
 *          readable 16:10 thumbnail of its first built entry and the category's one-line description, all one link
 *          to the category's tab on the components index. It lifts under the pointer (`.lift`).
 * Boundary: presentation only; the entries come from the registry, the words from the `showcase` catalogue.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) sections 3.2 and 5 (GroupCard); STA-1371 (readable
 *          thumbnails, 2026-10-28).
 */
import { byCategory, categoryKeys, categoryPath } from "@stackra/showcase";
import type { I18nKey } from "@stackra/i18n";
import { Card, Heading, Link, Text, useCatalogueText } from "@stackra/ui/react";
import { useLocation } from "react-router";

import { CategoryGlyph } from "#src/components/category-glyph";
import { ComponentThumbnail } from "#src/components/component-thumbnail";
import { MESSAGES } from "#src/constants/messages.constant";
import { SHOWCASE_KEYS } from "#src/constants/showcase-keys.constant";
import type { GroupCardProps } from "#src/components/group-card/group-card.props";

/** The card of one category. */
export function GroupCard({ category }: GroupCardProps) {
  const t = useCatalogueText(MESSAGES.en);
  const { search } = useLocation();
  const built = byCategory(category).filter((entry) => entry.status !== "planned");
  const keys = categoryKeys(category);
  const [first] = built;
  return (
    <Link
      href={`${categoryPath(category)}${search}`}
      underline="hover"
      className="group block h-full w-full hover:no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
    >
      <Card className="lift grid h-full w-full grid-rows-[auto_1fr] gap-0 overflow-hidden p-0">
        {first ? (
          <div className="aspect-[16/10] border-b border-separator">
            <ComponentThumbnail entry={first} />
          </div>
        ) : null}
        {/* On the card's own surface, above the thumbnail: a tall demo's clipped overflow never lies over the words. */}
        <div className="relative grid content-start gap-1 bg-surface p-4">
          <div className="flex items-center gap-3">
            <span
              aria-hidden="true"
              className="grid size-8 shrink-0 place-items-center bg-accent text-accent-foreground"
              style={{ borderRadius: "var(--radius-lg)" }}
            >
              <CategoryGlyph category={category} className="size-4" />
            </span>
            <Heading level={3} type="h5" className="min-w-0 flex-1 truncate">
              {t(keys.title as I18nKey)}
            </Heading>
            <Text type="small" tone="muted" className="shrink-0">
              <bdi>{t(SHOWCASE_KEYS.showcase.ui.count_components, { count: built.length })}</bdi>
            </Text>
          </div>
          <Text type="small" tone="muted" className="line-clamp-1">
            <bdi>{t(keys.description as I18nKey)}</bdi>
          </Text>
        </div>
      </Card>
    </Link>
  );
}
