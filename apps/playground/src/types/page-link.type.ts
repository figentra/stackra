/**
 * Stackra file contract:
 * Purpose: what the shell's navigation and the index page need to link a playground page: its path, title, the
 *          category it is listed under, and whether it draws its own `main`. Every route class carries the first three
 *          as statics. The tier is not here: it follows from the path (`tierOf`, `/pro-*` is Pro).
 * Boundary: types only.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 5); ADR 0294 (decision 14).
 */

import type { PageCategory } from "#src/enums/page-category.enum";

/** A page the playground links to. */
export interface PageLink {
  /** The URL path, `/<route folder>`. */
  readonly path: string;
  /** The page title, which is also its h1. */
  readonly title: string;
  /** The category the page is listed under, in the navigation and on the index. */
  readonly category: PageCategory;
  /** Whether the page draws its own `main` landmark (the Pro AppLayout does); the shell then adds none, so a page has one. */
  readonly ownsMain?: boolean;
}
