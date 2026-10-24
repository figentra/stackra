/**
 * Stackra file contract:
 * Purpose: what the shell's navigation and the index page need to link a playground page: its path, title, the
 *          category it is listed under and its tier. Every route class carries the first three as statics; the tier
 *          follows from the path (`/pro-*` is Pro).
 * Boundary: types only.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 5); ADR 0294 (decision 14).
 */

import type { PageCategory } from "#src/enums/page-category.enum";
import type { PageTier } from "#src/enums/page-tier.enum";

/** A page the playground links to. */
export interface PageLink {
  /** The URL path, `/<route folder>`. */
  readonly path: string;
  /** The page title, which is also its h1. */
  readonly title: string;
  /** The category the page is listed under, in the navigation and on the index. */
  readonly category: PageCategory;
  /** Free (`@stackra/ui`) or Pro (`@stackra/ui-pro`); left out, Free. */
  readonly tier?: PageTier | undefined;
}
