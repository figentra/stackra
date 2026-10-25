/**
 * Stackra file contract:
 * Purpose: `NavigationGroup`, one labelled group of the generated navigation tree.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0214; ADR 0164.
 */
import type { NavigationItem } from "#core/types/navigation-item.type";

/** A group of navigation entries. */
export interface NavigationGroup {
  /** The group's label key. */
  readonly group: string;

  /** The entries, in order. */
  readonly items: readonly NavigationItem[];
}
