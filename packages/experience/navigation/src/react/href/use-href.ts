/**
 * Stackra file contract:
 * Purpose: `useHref(to, params?)`, the href of a link target in the current locale mount, for a component that needs
 *          the string itself (a sidebar item's `href`, a share link).
 * Boundary: resolves on every render; a string target is returned as it is.
 * Runtime: browser
 * Governing contract: ADR 0303 (decision 1: router-aware UI lives in navigation); ADR 0297 (decision 4).
 */
import type { HrefParams } from "#core/types/href-params.type";
import type { RouteTarget } from "#core/types/route-target.type";
import { useHrefResolver } from "#react/href/use-href-resolver";

/**
 * The localised href of `to`.
 *
 * @throws RangeError when a route ref's key is not registered or a required param is missing.
 * @example
 * settingsHref = useHref(Routes.settings); // "/settings", or "/ar/settings" under the Arabic mount
 */
export function useHref(to: RouteTarget, params?: HrefParams): string {
  return useHrefResolver()(to, params);
}
