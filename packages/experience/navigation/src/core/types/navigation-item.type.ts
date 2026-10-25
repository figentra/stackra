/**
 * Stackra file contract:
 * Purpose: `NavigationItem`, one entry of the generated navigation tree: its label key, its target (a resource, a
 *          settings page, a route ref) and its icon.
 * Boundary: a type only; gen writes the items in `#stackra/navigation`, `useNavigation` resolves them.
 * Runtime: isomorphic
 * Governing contract: ADR 0214 (gate-filtered navigation); ADR 0164 (panel shell); ADR 0309 (icon names).
 */
import type { FlagRef } from "@stackra/feature-flags";
import type { IconName } from "@stackra/icons/contracts";

import type { RouteTarget } from "#core/types/route-target.type";

/** One entry of a navigation group. */
export interface NavigationItem {
  /** The label key. */
  readonly label: string;

  /** Where the entry goes. */
  readonly to: RouteTarget;

  /** The entry's icon. */
  readonly icon?: IconName;

  /** Hides the entry while the flag is off. */
  readonly flag?: FlagRef;

  /** The permission the entry needs; its target's (a resource's `permission`) when left out. */
  readonly permission?: string;
}
