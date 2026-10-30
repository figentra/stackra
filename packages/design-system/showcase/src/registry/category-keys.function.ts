/**
 * Stackra file contract:
 * Purpose: `categoryKeys`, the `showcase::` catalogue keys of a category: its title and its description.
 * Boundary: a pure function.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.1.
 */
import type { ComponentCategory } from "#src/enums/component-category.enum";

/** The title and description keys of `category`. */
export function categoryKeys(category: ComponentCategory): {
  readonly title: string;
  readonly description: string;
} {
  return {
    title: `showcase::category.${category}.title`,
    description: `showcase::category.${category}.description`,
  };
}
