/**
 * Stackra file contract:
 * Purpose: the Signature field route of @figentra/playground: its path, title and category. The page it renders is
 *          `pro-signature-field.tsx` beside it (ADR 0294 decision 14).
 * Boundary: route declaration only; no data loading.
 * Runtime: browser
 * Governing contract: ADR 0294 (decisions 14 and 16, rule R7); ADR 0310 (decision 12); STA-803.
 */
import { Route } from "@stackra/navigation";

import type { PageCategory } from "#src/enums/page-category.enum";

/** The `@stackra-pro/ui` Signature field page, at `/pro-signature-field`. */
export class ProSignatureFieldRoute extends Route({ path: "/pro-signature-field" }) {
  /** The page title, the component's name. */
  static readonly title = "Signature field";

  /** The category the page is listed under. */
  static readonly category: PageCategory = "Inputs and forms";
}
