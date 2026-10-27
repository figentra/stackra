/**
 * Stackra file contract:
 * Purpose: `ComponentPageProps`: props of `ComponentPage`.
 * Boundary: a type only, in its own file beside the component.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rule 12).
 */
import type { ReactNode } from "react";
import type { DesignSystemComponentRoute } from "#src/navigation/design-system-component-route.type";
import type { PageLink } from "#src/types/page-link.type";

/** Props of {@link ComponentPage}. */
export interface ComponentPageProps {
  /** Every page, in gallery order. */
  pages: readonly PageLink[];
  /** The route of the page inside. */
  route: DesignSystemComponentRoute;
  /** The component page the frame wraps. */
  children: ReactNode;
}
