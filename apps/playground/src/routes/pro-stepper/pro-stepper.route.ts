/**
 * Stackra file contract:
 * Purpose: the Stepper route of @figentra/playground: its path, title and category. The page it renders is
 *          `pro-stepper.tsx` beside it (ADR 0294 decision 14).
 * Boundary: route declaration only; no data loading.
 * Runtime: browser
 * Governing contract: ADR 0294 (decisions 14 and 16, rule R7); ADR 0310 (decision 12); STA-416 FR-012.
 */
import { Route } from "@stackra/navigation";

import type { PageCategory } from "#src/enums/page-category.enum";

/** The `@stackra-pro/ui` Stepper page, at `/pro-stepper`. */
export class ProStepperRoute extends Route({ path: "/pro-stepper" }) {
  /** The page title, the component's name. */
  static readonly title = "Stepper";

  /** The category the page is listed under: the `@stackra-pro/ui` pages. */
  static readonly category: PageCategory = "Navigation";
}
