/**
 * Stackra file contract:
 * Purpose: the playground's page list: the pages grouped under their category (Foundations, Actions, Typography,
 *          Navigation), in category order and then in the order given, each a link that keeps the URL's search
 *          params so the scheme and direction carry over. The index page and the shell's navigation both draw it.
 * Boundary: layout and links only; a category with no page is left out. The category name is a heading when the
 *          caller gives a level (the index page), else the label of its list (the navigation, which has no outline).
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 5); ADR 0294 (decision 14, rule R7).
 */
import type { HeadingLevel } from "@stackra/ui/contracts";
import * as Ui from "@stackra/ui/react";

import { PageCategory } from "#src/enums/page-category.enum";
import type { PageLink } from "#src/types/page-link.type";

/** Props of {@link PageList}. */
export interface PageListProps {
  /** The pages to list. */
  pages: readonly PageLink[];
  /** The URL search params to keep on each link, `?scheme=dark&locale=ar` or an empty string. */
  search: string;
  /** The heading level of each category name; left out, the name labels its list without being a heading. */
  headingLevel?: HeadingLevel;
}

/** The pages grouped by category. */
export function PageList({ pages, search, headingLevel }: PageListProps) {
  return (
    <div className="grid gap-4">
      {PageCategory.map((category) => {
        const inCategory = pages.filter((page) => page.category === category);
        if (inCategory.length === 0) return null;
        return (
          <div key={category} className="grid gap-2">
            {headingLevel ? (
              <Ui.Heading level={headingLevel}>{category}</Ui.Heading>
            ) : (
              <p className="text-sm font-semibold text-muted" aria-hidden="true">
                {category}
              </p>
            )}
            <ul aria-label={category} className="grid gap-2">
              {inCategory.map((page) => (
                <li key={page.path}>
                  <Ui.Link href={`${page.path}${search}`} underline="hover">
                    {page.title}
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
