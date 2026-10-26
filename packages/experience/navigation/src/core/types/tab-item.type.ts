/**
 * Stackra file contract:
 * Purpose: `TabItem`, one entry of an app's tabs (`tabs([...])`): the route, its order, icon and label key, from the
 *          routes that declare `tab`.
 * Boundary: a type only; gen writes the list in `#stackra/navigation`.
 * Runtime: isomorphic
 * Governing contract: ADR 0295 (decision 12: tab items from routes).
 */
import type { IconName } from "@stackra/icons/contracts";

import type { RouteRef } from "#core/types/route-ref.type";

/** One tab of the tab bar. */
export interface TabItem {
  /** The tab's route. */
  readonly route: RouteRef;

  /** Its place, from 1. */
  readonly order: number;

  /** The tab's icon. */
  readonly icon: IconName;

  /** Its label key: the route's title. */
  readonly label: string;
}
