/**
 * Stackra file contract:
 * Purpose: `ROUTER_KEYS`, the context keys `toRoot` was given, read by the loaders and actions of the route objects
 *          `toRoute` and `toLayout` built (they are built before `toRoot` is called, so they read it lazily).
 * Boundary: internal process state; one data router per process.
 * Runtime: browser
 * Governing contract: ADR 0165 (React Router 7 data routers).
 */
import type { RouteKeys } from "#react/route-keys/route-keys.type";

/** The data router's keys, or `null` when `toRoot` was given none. */
export const ROUTER_KEYS: { current: RouteKeys | null } = { current: null };
