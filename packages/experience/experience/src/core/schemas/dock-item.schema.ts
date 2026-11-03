/**
 * Stackra file contract:
 * Purpose: `DockItem`, one section in the page dock: the section's id, its link words and the status line the dock
 *          shows while it is current.
 * Boundary: a shape class only, the field type of `PageDockBlock`; gen compiles it with the block.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 26); ADR 0305 (one declaration per file); STA-2041.
 */
import type { LocalizedText } from "@stackra/contracts";
import { Schema } from "@stackra/validation";

/** A dock item. */
export class DockItem extends Schema {
  /** The section's id, the link's `#id`. */
  id!: string;

  label!: LocalizedText;

  status?: LocalizedText;
}
