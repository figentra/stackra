/**
 * Stackra file contract:
 * Purpose: `Pager`, the previous and next entries within the category on the platform shown, as two equal cards
 *          across the column: Previous at the start edge, Next at the end edge with its words end-aligned, each with
 *          the arrow (mirrored in right-to-left), the title and its category.
 * Boundary: links only; each keeps the URL's search params (scheme, locale, material).
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (row 12); WCAG 2.2 SC 2.4.8.
 */
import { categoryKeys, componentKeys, neighbours, webPath } from "@stackra/showcase";
import { Card, Icon, Link, useCatalogueText } from "@stackra/ui/react";
import type { I18nKey } from "@stackra/i18n";
import { useLocation } from "react-router";

import { COMPONENT_PAGE_KEYS } from "#src/components/component-page/component-page-keys.constant";
import type { SectionProps } from "#src/components/component-page/section.props";
import { MESSAGES } from "#src/constants/messages.constant";

const K = COMPONENT_PAGE_KEYS.showcase;

/** The previous and next entries in the category. */
export function Pager({ entry, platform }: SectionProps) {
  const t = useCatalogueText(MESSAGES.en);
  const { search } = useLocation();
  const { previous, next } = neighbours(entry, platform);
  const card = (item: typeof previous, side: "previous" | "next") =>
    item ? (
      <Link
        href={`${webPath(item)}${search}`}
        underline="hover"
        className="group block h-full w-full hover:no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
      >
        <Card className="lift h-full group-hover:border-accent/40">
          <Card.Header className={side === "next" ? "items-end text-end" : ""}>
            <Card.Description>
              <span className="flex items-center gap-1 text-xs text-muted">
                {side === "previous" ? (
                  <Icon name="arrow-left" size="sm" className="rtl:-scale-x-100" />
                ) : null}
                {t(K.pager[side])}
                {side === "next" ? (
                  <Icon name="arrow-right" size="sm" className="rtl:-scale-x-100" />
                ) : null}
              </span>
            </Card.Description>
            <Card.Title>{t(componentKeys(item).title as I18nKey)}</Card.Title>
            <span className="text-xs text-muted">
              {t(categoryKeys(item.category).title as I18nKey)}
            </span>
          </Card.Header>
        </Card>
      </Link>
    ) : (
      <span />
    );
  return (
    <nav aria-label={t(K.section.pager)} className="grid gap-3 sm:grid-cols-2">
      {card(previous, "previous")}
      {card(next, "next")}
    </nav>
  );
}
