/**
 * Stackra file contract:
 * Purpose: `NativeNavigate`, what the native `useNavigate()` returns: push a route (`to`), replace the current screen
 *          with one (`replace`, a sheet that hands over to the record it created), or go back.
 * Boundary: a type only; routes are named by their refs, so the screen name is the route key.
 * Runtime: react-native
 * Governing contract: ADR 0165 (React Navigation on mobile); ADR 0294 (decision 20).
 */
import type { HrefParams } from "#core/types/href-params.type";
import type { RouteRef } from "#core/types/route-ref.type";

/** Native navigation by route ref. */
export interface NativeNavigate {
  /** Pushes the route's screen with its params. */
  to(route: RouteRef, params?: HrefParams): void;

  /** Replaces the current screen with the route's. */
  replace(route: RouteRef, params?: HrefParams): void;

  /** Goes back one screen. */
  back(): void;
}
