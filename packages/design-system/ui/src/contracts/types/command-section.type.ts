/**
 * Stackra file contract:
 * Purpose: `CommandSection`, a titled group of commands in a command palette.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); STA-1371.
 */
import type { CommandItem } from "#contracts/types/command-item.type";

/** A group of commands. */
export interface CommandSection {
  readonly id: string;
  readonly title: string;
  readonly items: readonly CommandItem[];
}
