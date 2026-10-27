/**
 * Stackra file contract:
 * Purpose: `CommandPaletteProps`: props of `CommandPalette`.
 * Boundary: a type only, in its own file beside the component.
 * Runtime: browser
 * Governing contract: ADR 0305 (rule 12).
 */
import type { PageLink } from "#src/types/page-link.type";
import type { PaletteAction } from "#src/components/command-palette/palette-action.type";

/** Props of {@link CommandPalette}. */
export interface CommandPaletteProps {
  /** Every page, in navigation order. */
  pages: readonly PageLink[];
  /** The quick actions. */
  actions: readonly PaletteAction[];
  /** The URL search params each page link keeps. */
  search: string;
  /** Whether the palette is open. */
  isOpen: boolean;
  /** Called when the palette closes itself (Escape, the scrim, a run). */
  onClose: () => void;
}
