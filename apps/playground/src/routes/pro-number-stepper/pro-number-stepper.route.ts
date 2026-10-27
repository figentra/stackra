/**
 * Stackra file contract:
 * Purpose: the NumberStepper route of @figentra/playground: its path, title and category. The page it renders is
 *          `pro-number-stepper.tsx` beside it (ADR 0294 decision 14).
 * Boundary: route declaration only; no data loading.
 * Runtime: browser
 * Governing contract: ADR 0294 (decisions 14 and 16, rule R7); ADR 0302 (decision 5); ADR 0310 (decision 6).
 */
import { Route } from "@stackra/navigation";

import type { PageCategory } from "#src/enums/page-category.enum";

/** The `@stackra-pro/ui` NumberStepper page, at `/pro-number-stepper`. */
export class ProNumberStepperRoute extends Route({ path: "/pro-number-stepper" }) {
  /** The page title, the component's name. */
  static readonly title = "NumberStepper";

  /** The category the page is listed under: the `@stackra-pro/ui` pages. */
  static readonly category: PageCategory = "Inputs and forms";
}
