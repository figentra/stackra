/**
 * Stackra file contract:
 * Purpose: `ResolvedNavigationGroup`, one navigation group ready to draw: each entry with its localised `href` and
 *          whether it is the current page; entries behind a flag that is off are gone, as are empty groups.
 * Boundary: a type only; what `useNavigation(tree)` returns.
 * Runtime: isomorphic
 * Governing contract: ADR 0214 (gate-filtered navigation); ADR 0297 (decision 4).
 */
import type { IconName } from "@stackra/icons/contracts";

/** A drawable navigation group. */
export interface ResolvedNavigationGroup {
  /** The group's label key. */
  readonly group: string;

  /** The entries, in order. */
  readonly items: readonly {
    /** The label key. */
    readonly label: string;
    /** The localised href. */
    readonly href: string;
    /** True on the entry's page and below it. */
    readonly isCurrent: boolean;
    /** The entry's icon. */
    readonly icon?: IconName;
  }[];
}
