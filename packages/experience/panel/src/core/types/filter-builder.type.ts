/**
 * Stackra file contract:
 * Purpose: `FilterBuilder`, one filter under construction: its starting value, whether it is pinned beside search and its
 *          look.
 * Boundary: a type only; chainable.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rule 2).
 */
import type { Built } from "#core/types/built.type";
import type { FilterNode } from "#core/types/filter-node.type";

/** A field filter's look: its words, control, quick filter settings, choices and presets. */
type FilterLook = Omit<
  Extract<FilterNode, { readonly key: string }>,
  "kind" | "key" | "operator" | "enum" | "default" | "pinned"
>;

/** The chainable builder of one table filter. */
export interface FilterBuilder extends Built<FilterNode> {
  /** The value the filter starts with on the Default view. */
  default: (value: unknown) => this;

  /** Pins the filter beside the search box. */
  pinned: () => this;

  /** Sets the filter's look (`{ control: "multi-choice", choices: [...] }`); a later call merges. Ignored by `trashed`. */
  with: (look: FilterLook) => this;
}
