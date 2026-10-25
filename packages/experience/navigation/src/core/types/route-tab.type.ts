/**
 * Stackra file contract:
 * Purpose: `RouteTab`, a route's tab entry (`Route({ tab: { order, icon } })`): its place in the tab bar and its icon;
 *          the label is the route's title.
 * Boundary: a type only. Gen builds the app's `Tabs` and the native tab bar from the routes that declare one.
 * Runtime: isomorphic
 * Governing contract: ADR 0295 (decision 12: tab items from routes); ADR 0309 (icon names).
 */
import type { IconName } from "@stackra/icons/contracts";

/** The tab entry of a route. */
export interface RouteTab {
  /** The place in the tab bar, from 1. */
  readonly order: number;

  /** The tab's icon. */
  readonly icon: IconName;
}
