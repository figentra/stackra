/**
 * Stackra file contract:
 * Purpose: `PageGalleryProps`: props of `PageGallery`.
 * Boundary: a type only, in its own file beside the component.
 * Runtime: browser
 * Governing contract: ADR 0305 (rule 12).
 */
import type { HeadingLevel } from "@stackra/ui/contracts";
import type { PageLink } from "#src/types/page-link.type";

/** Props of {@link PageGallery}. */
export interface PageGalleryProps {
  /** The pages to show, in navigation order. */
  pages: readonly PageLink[];
  /** The URL search params each card keeps. */
  search: string;
  /** The heading level of each category name. */
  headingLevel: HeadingLevel;
}
