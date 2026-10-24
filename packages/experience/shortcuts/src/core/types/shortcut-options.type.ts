/**
 * Stackra file contract:
 * Purpose: `ShortcutOptions`, what `Shortcut({...})` takes: the optional key binding, the palette group, and the icon
 *          and extra search words the palette shows.
 * Boundary: a type only. The key (`console.open_palette`) and the label (`shortcuts::open_palette.label`) are derived
 *           from the member and the file by gen, so neither is an option. A palette entry with no key binding omits
 *           `keys`.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 16, 20 and 23); ADR 0245 (intents); registry v3.1 final review H (chords).
 */
import type { IconName } from "@stackra/icons/contracts";

/** The options of a shortcut class. */
export interface ShortcutOptions {
  /**
   * The key binding: modifiers and one key joined by `+` (`mod+shift+l`), or a chord sequence of such steps separated
   * by spaces (`g s`). `mod` is Command on Apple devices and Control elsewhere. Omitted for a palette-only entry.
   */
  readonly keys?: string;

  /** The i18n key of the palette group the entry is listed under (`I18n.console.palette.group_app`). */
  readonly group: string;

  /** The icon the palette shows beside the label. */
  readonly icon?: IconName;

  /** Extra words the palette matches the entry by, besides its translated label. */
  readonly intents?: readonly string[];
}
