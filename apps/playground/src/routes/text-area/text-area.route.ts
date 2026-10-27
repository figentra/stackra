/**
 * Stackra file contract:
 * Purpose: the text-area route of @figentra/playground: its path, title and category. The page it renders is
 *          `text-area.tsx` beside it (ADR 0294 decision 14).
 * Boundary: route declaration only; no data loading.
 * Runtime: browser
 * Governing contract: ADR 0294 (decisions 14 and 16, rule R7); ADR 0302 (decision 5).
 */
import { Route } from "@stackra/navigation";

import type { PageCategory } from "#src/enums/page-category.enum";

/** The TextArea page, at `/text-area`. */
export class TextAreaRoute extends Route({ path: "/text-area" }) {
  /** The page title. */
  static readonly title = "Text area";

  /** The category the page is listed under. */
  static readonly category: PageCategory = "Inputs and forms";
}
