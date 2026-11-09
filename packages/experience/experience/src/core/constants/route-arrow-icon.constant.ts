/**
 * Stackra file contract:
 * Purpose: `ROUTE_ARROW_ICON`, the arrow a timeline hero draws between a route's origin and destination.
 * Boundary: data only, held here because an icon position takes a constant, never a literal (R-56); `Icon` mirrors
 *           it in right-to-left by itself.
 * Runtime: isomorphic
 * Governing contract: owner decision R-56; ADR 0322 (decision 3); STA-2041.
 */
import type { IconName } from "@stackra/icons/contracts";

/** The origin-to-destination arrow. */
export const ROUTE_ARROW_ICON = "arrow-right" as const satisfies IconName;
