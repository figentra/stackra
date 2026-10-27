/**
 * Stackra file contract:
 * Purpose: `PageGalleryProps`: props of `PageGallery`.
 * Boundary: a type only, in its own file beside the component.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rule 12).
 */
import type { DesignSystemComponentRoute } from "#src/navigation/design-system-component-route.type";
import type { PageLink } from "#src/types/page-link.type";

/** Props of {@link PageGallery}. */
export interface PageGalleryProps {
  /** The pages to show, in gallery order. */
  pages: readonly PageLink[];
  /** Opens a page. */
  onOpen: (route: DesignSystemComponentRoute) => void;
}
