/**
 * Stackra file contract:
 * Purpose: the playground's page list: the pages grouped under their category (see `PageCategory`), in category
 *          order and then in the order given, each a full-width row link with a "Pro" badge on a Pro page, keeping the
 *          URL's search params so the scheme and direction carry over. The command palette draws it.
 * Boundary: layout and links only; a category with no page is left out. The category name is a heading when the
 *          caller gives a level, else the label of its list.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 5); ADR 0294 (decision 14, rule R7).
 */
import type { HeadingLevel } from "@stackra/ui/contracts";
import * as Ui from "@stackra/ui/react";

import { PageCategory } from "#src/enums/page-category.enum";
import type { PageLink } from "#src/types/page-link.type";

// shortcut: English strings in one place until @stackra/i18n ships; then `playground::page-list.*` keys.
const STRINGS = { pro: "Pro" } as const;

/** Props of {@link PageList}. */
export interface PageListProps {
  /** The pages to list. */
  pages: readonly PageLink[];
  /** The URL search params to keep on each link, `?scheme=dark&locale=ar` or an empty string. */
  search: string;
  /** The heading level of each category name; left out, the name labels its list without being a heading. */
  headingLevel?: HeadingLevel;
}

/** The pages grouped by category, as rows. */
export function PageList({ pages, search, headingLevel }: PageListProps) {
  return (
    <div className="grid gap-4">
      {PageCategory.map((category) => {
        const inCategory = pages.filter((page) => page.category === category);
        if (inCategory.length === 0) return null;
        return (
          <div key={category} className="grid gap-1">
            {headingLevel ? (
              <Ui.Heading level={headingLevel} className="px-3 text-sm text-muted">
                {category}
              </Ui.Heading>
            ) : (
              <p className="px-3 text-xs font-semibold tracking-wide text-muted" aria-hidden="true">
                {category}
              </p>
            )}
            <ul aria-label={category} className="grid">
              {inCategory.map((page) => (
                <li key={page.path}>
                  <Ui.Link
                    href={`${page.path}${search}`}
                    underline="hover"
                    className="flex min-h-10 w-full items-center justify-between gap-3 rounded-xl px-3 py-2 hover:bg-default hover:no-underline focus-visible:bg-default"
                  >
                    {page.title}
                    {page.tier === "Pro" ? (
                      <Ui.Chip size="sm" variant="soft" tone="accent">
                        {STRINGS.pro}
                      </Ui.Chip>
                    ) : null}
                  </Ui.Link>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
