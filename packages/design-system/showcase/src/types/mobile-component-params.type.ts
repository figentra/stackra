/**
 * Stackra file contract:
 * Purpose: `MobileComponentParams`, the params of the mobile `Component` route.
 * Boundary: a type only, in its own file.
 * Runtime: isomorphic
 * Governing contract: showcase redesign spec (2026-10-27) section 2.2; ADR 0305 (one declaration per file).
 */
import type { ComponentTier } from "#src/enums/component-tier.enum";
import type { DocTab } from "#src/enums/doc-tab.enum";

/** The params of the one mobile component route. */
export interface MobileComponentParams {
  readonly tier: ComponentTier;
  readonly slug: string;
  readonly tab?: DocTab;
  // `undefined` clears the example when the screen moves to another component.
  readonly example?: string | undefined;
}
