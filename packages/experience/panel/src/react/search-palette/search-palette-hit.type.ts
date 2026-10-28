/**
 * Stackra file contract:
 * Purpose: `SearchPaletteHit`, one hit the palette draws: the key, title and snippet a model's generated search query
 *          (`<model>.search`, `SearchQuery` of @stackra/search) answers with.
 * Boundary: a type only. It mirrors `SearchQueryHit` structurally, because the panel's web entry never imports the
 *           search package's server entry.
 * Runtime: browser
 * Governing contract: ADR 0221 (decisions 4 and 6, settled 2026-10-29).
 */

/** One hit of a model's search query. */
export interface SearchPaletteHit {
  /** The row's primary key, as text. */
  readonly id: string;

  /** The text the row shows. */
  readonly title: string;

  /** The excerpt around the phrase, when a field matched. */
  readonly snippet?: string | undefined;
}
