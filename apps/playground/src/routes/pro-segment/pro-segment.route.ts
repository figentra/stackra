/**
 * Stackra file contract:
 * Purpose: the Segment route of @figentra/playground: its path, title and category. The page it renders is
 *          `pro-segment.tsx` beside it (ADR 0294 decision 14).
 * Boundary: route declaration only; no data loading.
 * Runtime: browser
 * Governing contract: ADR 0294 (decisions 14 and 16, rule R7); ADR 0310 (decision 12); STA-416 FR-012.
 */
import { Route } from "@stackra/navigation";

import type { PageCategory } from "#src/enums/page-category.enum";

/** The `@stackra-pro/ui` Segment page, at `/pro-segment`. */
export class ProSegmentRoute extends Route({ path: "/pro-segment" }) {
  /** The page title, the component's name. */
  static readonly title = "Segment";

  /** The category the page is listed under: the `@stackra-pro/ui` pages. */
  static readonly category: PageCategory = "Navigation";
}
