/**
 * Stackra file contract:
 * Purpose: the props every runtime's `Breadcrumbs` takes: the trail from the root to the current page and the
 *          spoken name of the landmark. Each runtime's `BreadcrumbsProps` is this plus its own base props, which pass
 *          through unchanged.
 * Boundary: types only. The trail never reads the router: the app builds `items` from its own location, and an item's
 *          `href` reaches the router through the nearest `RouterProvider`.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0313; WCAG 2.2 SC 2.4.8 (location).
 */
import type { BreadcrumbItem } from "#contracts/types/breadcrumb-item.type";

/** Props shared by the web and native `Breadcrumbs`. */
export interface BreadcrumbsContractProps {
  /** The trail from the root to the current page, in order; the last item is the current page. */
  readonly items: readonly BreadcrumbItem[];
  /** The spoken name of the trail's landmark. Defaults to the `ui` catalogue's phrase in the active locale. */
  readonly label?: string | undefined;
}
