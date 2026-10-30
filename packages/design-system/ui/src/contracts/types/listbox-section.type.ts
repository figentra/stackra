/**
 * Stackra file contract:
 * Purpose: `ListboxSection`, a titled group of a Listbox's options.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); STA-1371 (wave A).
 */
import type { SelectItem } from "#contracts/types/select-item.type";

/** A titled group of options. */
export interface ListboxSection {
  /** Unique within the list. */
  readonly id: string;
  /** The group's heading. */
  readonly title: string;
  /** The group's options. */
  readonly items: readonly SelectItem[];
}
