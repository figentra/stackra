/**
 * Stackra file contract:
 * Purpose: `SearchPaletteGroupProps`, the props of one model's hits inside the search palette.
 * Boundary: props only; internal to the palette.
 * Runtime: browser
 * Governing contract: ADR 0221 (decision 4, settled 2026-10-29).
 */
import type { SearchPaletteHit } from "#react/search-palette/search-palette-hit.type";
import type { SearchPaletteSource } from "#react/search-palette/search-palette-source.type";

/** Props of `SearchPaletteGroup`. */
export interface SearchPaletteGroupProps {
  /** The model searched. */
  readonly source: SearchPaletteSource;

  /** The phrase, already trimmed and settled. */
  readonly phrase: string;

  /** Hits at most. */
  readonly limit: number;

  /** Called with how many hits the model answered, so the palette knows when every model found none. */
  readonly onCount: (key: string, count: number) => void;

  /** What picking a hit does. */
  readonly onSelect: (source: SearchPaletteSource, hit: SearchPaletteHit) => void;
}
