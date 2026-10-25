/**
 * Stackra file contract:
 * Purpose: `useHrefResolver()`, a stable function that resolves a link target to its href in the current locale mount;
 *          `useHref`, `Link`, `NavLink`, `useNavigate`, `useMenu` and `useNavigation` all resolve through it.
 * Boundary: internal; the same function while the mount is the same.
 * Runtime: browser
 * Governing contract: ADR 0297 (decision 4); ADR 0294 (decision 20).
 */
import { useCallback } from "react";

import { resolveHref } from "#core/functions/resolve-href.function";
import type { HrefParams } from "#core/types/href-params.type";
import type { RouteTarget } from "#core/types/route-target.type";
import { useMount } from "#react/mount/use-mount";

/**
 * Resolves targets in the current locale mount.
 *
 * @example
 * const href = useHrefResolver();
 * href(Routes.product, { slug: "tee" }); // "/ar-sa/store/tee" under the Saudi mount
 */
export function useHrefResolver(): (to: RouteTarget, params?: HrefParams) => string {
  const mount = useMount();
  return useCallback((to, params) => resolveHref(to, params, mount), [mount]);
}
