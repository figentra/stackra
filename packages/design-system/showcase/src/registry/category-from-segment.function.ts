/**
 * Stackra file contract:
 * Purpose: `categoryFromSegment`, the category a `/components/:category` URL segment names (the reverse of `categoryPath`).
 * Boundary: a pure function.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.2.
 */
import { ComponentCategory } from "#src/enums/component-category.enum";

/** The category named by a URL segment ("inputs-and-forms"), or undefined for an unknown one. */
export function categoryFromSegment(segment: string): ComponentCategory | undefined {
  const id = segment.replaceAll("-", "_");
  return ComponentCategory.find((category) => category === id);
}
