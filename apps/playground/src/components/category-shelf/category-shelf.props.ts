/**
 * Stackra file contract:
 * Purpose: `CategoryShelfProps`: props of `CategoryShelf`.
 * Boundary: a type only, in its own file beside the component.
 * Runtime: browser
 * Governing contract: ADR 0305 (rule 12); showcase redesign spec section 3.2.
 */
import type { ComponentCategory, ComponentEntry } from "@stackra/showcase";

/** Props of {@link CategoryShelf}. */
export interface CategoryShelfProps {
  /** The category the shelf shows. */
  category: ComponentCategory;
  /** The entries it lists, in order. */
  entries: readonly ComponentEntry[];
  /** The heading's level: 2 on the components index (default), 3 under the home's "Categories". */
  headingLevel?: 2 | 3 | undefined;
  /** True on the category's own page: no "View all", the description under the heading, one card per row on a phone. */
  isAlone?: boolean | undefined;
}
