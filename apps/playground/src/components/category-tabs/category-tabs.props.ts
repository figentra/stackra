/**
 * Stackra file contract:
 * Purpose: `CategoryTabsProps`: props of `CategoryTabs`.
 * Boundary: a type only, in its own file beside the component.
 * Runtime: browser
 * Governing contract: ADR 0305 (rule 12); showcase redesign spec section 3.
 */
import type { ComponentCategory } from "@stackra/showcase";

/** Props of {@link CategoryTabs}. */
export interface CategoryTabsProps {
  /** The selected category; undefined is All. */
  category?: ComponentCategory | undefined;
}
