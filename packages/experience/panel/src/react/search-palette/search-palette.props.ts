/**
 * Stackra file contract:
 * Purpose: `SearchPaletteProps`, the props of the web Cmd+K search palette: the models it searches, whether it is open,
 *          and what picking a hit does.
 * Boundary: props only. The palette is opened by the app's own `Shortcut` (`mod+k`), never by a key it binds itself.
 * Runtime: browser
 * Governing contract: ADR 0221 (decision 4, settled 2026-10-29).
 */
import type { SearchPaletteHit } from "#react/search-palette/search-palette-hit.type";
import type { SearchPaletteSource } from "#react/search-palette/search-palette-source.type";

/** Props of `SearchPalette`. */
export interface SearchPaletteProps {
  /** The models searched, in the order their hits are drawn. */
  readonly sources: readonly SearchPaletteSource[];

  /** Whether the palette is open. */
  readonly isOpen: boolean;

  /** Called with `false` when the reader dismisses the palette or picks a hit. */
  readonly onOpenChange: (isOpen: boolean) => void;

  /** What picking a hit does, usually opening the record's page; the palette closes after it. */
  readonly onSelect: (source: SearchPaletteSource, hit: SearchPaletteHit) => void;

  /** Hits per model, 1 to 50; 5 when absent. */
  readonly limit?: number | undefined;
}
