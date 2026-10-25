/**
 * Stackra file contract:
 * Purpose: what the design-system landing, a page's category strip and its pager need to link a component page:
 *          its title, the category it is listed under, its tier and its Settings stack route.
 * Boundary: types only; `design-system-components.ts` adds each page's screen.
 * Runtime: react-native
 * Governing contract: ADR 0310 (decision 6); ADR 0294 (decision 14).
 */
import type { ComponentCategory } from "../enums/component-category.enum";
import type { ComponentTier } from "../enums/component-tier.enum";
import type { DesignSystemComponentRoute } from "../navigation/types";

/** A component page the review area links to. */
export interface PageLink {
  /** The section of the gallery the page is listed under, and its category strip. */
  readonly category: ComponentCategory;
  /** The package the component comes from: Free (`@stackra/ui`) or Pro (`@stackra-pro/ui`, badged). */
  readonly tier: ComponentTier;
  /** The component's name, shown in the gallery, on the strip and pager, and as the page title. */
  readonly title: string;
  /** The Settings stack route of the page. */
  readonly route: DesignSystemComponentRoute;
}
