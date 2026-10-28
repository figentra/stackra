/**
 * Stackra file contract:
 * Purpose: `DiscoveredPage`: a discovered page: the link the navigation draws and the element the router renders at
 *          its path.
 * Boundary: a type only, in its own file (ADR 0305 rule 10).
 * Runtime: browser
 * Governing contract: ADR 0305 (rule 10); ADR 0302 (decision 5).
 */
import type { ReactElement } from "react";
import type { PageLink } from "#src/types/page-link.type";

/** A discovered page: the link the navigation draws and the element the router renders at its path. */
export interface DiscoveredPage {
  /** The path, title and category of the page. */
  readonly route: PageLink;
  /** The page, rendered at `route.path`. */
  readonly element: ReactElement;
}
