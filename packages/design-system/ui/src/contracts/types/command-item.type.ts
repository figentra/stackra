/**
 * Stackra file contract:
 * Purpose: `CommandItem`, one command of a command palette: its id, label, optional hint, icon, shortcut and extra
 *          search words.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); STA-1371.
 */
import type { IconName } from "@stackra/icons/contracts";

/** One command of a command palette. */
export interface CommandItem {
  /** A stable id, handed back when the command is chosen. */
  readonly id: string;
  /** The words shown for the command. */
  readonly label: string;
  /** A second line explaining the command. */
  readonly description?: string | undefined;
  /** The icon drawn before the label. */
  readonly icon?: IconName | undefined;
  /** A shortcut hint, as text ("⌘N"); web only. */
  readonly shortcut?: string | undefined;
  /** More words that find it, in any language: "invoice, bill". */
  readonly keywords?: string | undefined;
}
