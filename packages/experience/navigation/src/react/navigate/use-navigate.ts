/**
 * Stackra file contract:
 * Purpose: `useNavigate()`, client navigation by target: `navigate(Routes.settings)` goes to the route in the current
 *          locale mount, `navigate(href)` to an href already built (a sidebar item's, `useLocaleHref`'s).
 * Boundary: wraps React Router's navigate; a string is followed as it is. The function is stable while the mount and
 *           the router are.
 * Runtime: browser
 * Governing contract: ADR 0303 (decision 1); ADR 0297 (decision 4).
 */
import { useCallback } from "react";
import { useNavigate as useRouterNavigate } from "react-router";

import type { RouteTarget } from "#core/types/route-target.type";
import { useHrefResolver } from "#react/href/use-href-resolver";
import type { NavigateOptions } from "#react/navigate/navigate-options.type";

/**
 * Navigates on the client.
 *
 * @example
 * navigate = useNavigate();
 * this.navigate(this.hrefFor(next));
 */
export function useNavigate(): (to: RouteTarget, options?: NavigateOptions) => void {
  const navigate = useRouterNavigate();
  const resolve = useHrefResolver();
  return useCallback(
    (to, options = {}) => {
      const { replace, state, ...params } = options;
      void navigate(resolve(to, params), {
        ...(replace === undefined ? {} : { replace }),
        ...(state === undefined ? {} : { state }),
      });
    },
    [navigate, resolve],
  );
}
