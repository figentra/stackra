/**
 * Stackra file contract:
 * Purpose: `CategoryStripProps`: props of `CategoryStrip`.
 * Boundary: a type only, in its own file beside the component.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rule 12).
 */
import type { DesignSystemComponentRoute } from "#src/navigation/design-system-component-route.type";
import type { PageLink } from "#src/types/page-link.type";

/** Props of {@link CategoryStrip}. */
export interface CategoryStripProps {
  /** Every page, in gallery order. */
  pages: readonly PageLink[];
  /** The page on screen. */
  current: PageLink;
  /** Opens a page of the category. */
  onOpen: (route: DesignSystemComponentRoute) => void;
  /** Goes back to the gallery. */
  onOpenAll: () => void;
}
