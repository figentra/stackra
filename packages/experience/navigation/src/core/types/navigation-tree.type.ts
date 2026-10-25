/**
 * Stackra file contract:
 * Purpose: `NavigationTree`, a panel's generated navigation (`navigation(Panels.TenantAdmin, groups)`): the panel and
 *          its groups in order.
 * Boundary: a type only, frozen data; `useNavigation(tree)` resolves it for the viewer.
 * Runtime: isomorphic
 * Governing contract: ADR 0214; ADR 0164; ADR 0307.
 */
import type { AnyClass } from "@stackra/container";

import type { NavigationGroup } from "#core/types/navigation-group.type";

/** The navigation of one panel. */
export interface NavigationTree {
  /** The panel class. */
  readonly panel: AnyClass;

  /** The groups, in order. */
  readonly groups: readonly NavigationGroup[];
}
