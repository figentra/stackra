/**
 * Stackra file contract:
 * Purpose: the accordion route of @figentra/playground: its path, title and category. The page it renders is
 *          `accordion.tsx` beside it (ADR 0294 decision 14).
 * Boundary: route declaration only; no data loading.
 * Runtime: browser
 * Governing contract: ADR 0294 (decisions 14 and 16, rule R7); ADR 0302 (decision 5).
 */
import { Route } from "@stackra/navigation";

import type { PageCategory } from "#src/enums/page-category.enum";

/** The Accordion page, at `/accordion`. */
export class AccordionRoute extends Route({ path: "/accordion" }) {
  /** The page title. */
  static readonly title = "Accordion";

  /** The category the page is listed under. */
  static readonly category: PageCategory = "Data display";
}
