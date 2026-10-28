/**
 * Stackra file contract:
 * Purpose: `SearchPaletteSource`, one model the palette searches: its generated search query and the name its hits
 *          show beside them.
 * Boundary: a type only. The query is the client ref gen writes for a `SearchQuery` (`SearchProductQuery`), whose input
 *           takes `q` and `limit` and whose answer is `{ hits }`; the caller passes the label already translated.
 * Runtime: browser
 * Governing contract: ADR 0221 (decisions 4 and 6, settled 2026-10-29).
 */
import type { QueryRef } from "@stackra/clients";

/** One model the palette searches. */
export interface SearchPaletteSource {
  /** The model's generated search query (`product.search`). */
  readonly query: QueryRef;

  /** The model's name in the reader's language (`Products`), drawn beside each of its hits. */
  readonly label: string;
}
