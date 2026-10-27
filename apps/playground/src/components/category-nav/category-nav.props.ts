/**
 * Stackra file contract:
 * Purpose: `CategoryNavProps`: props of `CategoryNav`.
 * Boundary: a type only, in its own file beside the component.
 * Runtime: browser
 * Governing contract: ADR 0305 (rule 12).
 */
import type { PageLink } from "#src/types/page-link.type";

/** Props of {@link CategoryNav}. */
export interface CategoryNavProps {
  /** Every page, in navigation order. */
  pages: readonly PageLink[];
  /** The page on screen. */
  current: PageLink;
  /** The URL search params each link keeps. */
  search: string;
}
