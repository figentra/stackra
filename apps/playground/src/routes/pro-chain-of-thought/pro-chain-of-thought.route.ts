/**
 * Stackra file contract:
 * Purpose: the ChainOfThought route of @figentra/playground: its path, title and category. The page it renders is
 *          `pro-chain-of-thought.tsx` beside it (ADR 0294 decision 14).
 * Boundary: route declaration only; no data loading.
 * Runtime: browser
 * Governing contract: ADR 0294 (decisions 14 and 16, rule R7); ADR 0302 (decision 5); ADR 0310 (decision 12).
 */
import { Route } from "@stackra/navigation";

import type { PageCategory } from "#src/enums/page-category.enum";

/** The `@stackra-pro/ui` ChainOfThought page, at `/pro-chain-of-thought`. */
export class ProChainOfThoughtRoute extends Route({ path: "/pro-chain-of-thought" }) {
  /** The page title, the component's name. */
  static readonly title = "ChainOfThought";

  /** The category the page is listed under: the `@stackra-pro/ui` pages. */
  static readonly category: PageCategory = "AI";
}
