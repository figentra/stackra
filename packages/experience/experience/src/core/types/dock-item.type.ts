/**
 * Stackra file contract:
 * Purpose: `DockItem`, one section in the page dock: the section's id, its link words and the status line the dock
 *          shows while it is current.
 * Boundary: a type only, the field type of `PageDockBlock`.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (one declaration per file); STA-2041.
 */
import type { LocalizedText } from "@stackra/contracts";

/** A dock item. */
export interface DockItem {
  /** The section's id, the link's `#id`. */
  readonly id: string;

  /** The link's words. */
  readonly label: LocalizedText;

  /** The line the dock shows while this section is current. */
  readonly status?: LocalizedText;
}
