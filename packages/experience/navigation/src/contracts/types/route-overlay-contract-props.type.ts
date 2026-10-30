/**
 * Stackra file contract:
 * Purpose: the props every runtime's `RouteOverlay` takes: the overlay's title and close label, how it is drawn, how
 *          it may be dismissed, a footer for its actions and the content, which is the route's page. Each runtime's
 *          `RouteOverlayProps` is this and nothing more, because the open state is the route and not a prop.
 * Boundary: types only. The title names the overlay for assistive technology, and the close label is required so a
 *           screen reader never hears an unnamed button.
 * Runtime: isomorphic
 * Governing contract: ADR 0317 (decisions 2 and 9); ADR 0312 (overlay vocabulary); WCAG 2.2 SC 2.1.2, 2.4.3 and
 *          4.1.2; ADR 0317 amendment 2026-10-28 (stacked overlays).
 */
import type { ReactNode } from "react";

import type { OverlayPresentation } from "#contracts/enums/overlay-presentation.enum";

/** Props shared by the web and native `RouteOverlay`. */
export interface RouteOverlayContractProps {
  /** The route's page: the content of the overlay's body. */
  readonly children?: ReactNode;
  /** The overlay's title, required. It is a heading and the overlay's accessible name. */
  readonly title: ReactNode;
  /** The accessible name of the close button, in the app's language, for example "Close". */
  readonly closeLabel: string;
  /** How the overlay is drawn. Defaults to `modal`. */
  readonly presentation?: OverlayPresentation | undefined;
  /**
   * True, the default, to let the user dismiss the overlay with a press outside it, Escape or a swipe. False keeps all
   * three off for a step the user must finish; the close button stays, so there is no keyboard trap. A page can flip
   * it later with `useRouteOverlay().setDismissable`.
   */
  readonly isDismissable?: boolean | undefined;
  /** The overlay's actions, in a footer under the body: usually a Cancel and a Save button. */
  readonly footer?: ReactNode;
  /** The width of a `modal` on web: `sm`, `md` (the default) or `lg`. Native modals are sized by the platform. */
  readonly size?: "sm" | "md" | "lg" | undefined;
  /**
   * The overlay's name in the breadcrumb of the drawers stacked over it (web). Defaults to `title` when it is text;
   * set it when `title` is an element.
   */
  readonly trailLabel?: string | undefined;
}
