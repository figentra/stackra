/**
 * Stackra file contract:
 * Purpose: `sectionKey`, the `showcase::` catalogue key of a component page section heading.
 * Boundary: a pure function.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 4.
 */
import type { ComponentSection } from "#src/enums/component-section.enum";

/** The heading key of `section`, such as "showcase::section.api". */
export function sectionKey(section: ComponentSection): string {
  return `showcase::section.${section}`;
}
