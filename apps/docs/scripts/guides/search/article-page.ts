/**
 * Stackra file contract:
 * Purpose: `ArticlePage`, one page of the "Search" guide's found articles: the rows, best first, whether another page
 *          follows and its cursor.
 * Boundary: a type, as an app's `src/modules/help/types/article-page.type.ts` would hold it.
 * Runtime: node
 * Governing contract: ADR 0221; STA-2843.
 */
import type { Article } from "./article.model";

/** One page of found articles. */
export interface ArticlePage {
  /** The articles, best match first. */
  readonly items: readonly Article[];

  /** Whether another page follows. */
  readonly hasMore: boolean;

  /** The cursor of the next page, when there is one. */
  readonly nextCursor?: string | undefined;
}
