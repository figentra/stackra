/**
 * Stackra file contract:
 * Purpose: `nativeLoad(type, input)`, one run of a route's or layout's loader on a native screen: a request for the
 *          route's path with its params, the route context in the app's current locale, and the answer as data (with
 *          the validated params and query) or as a redirect for the screen to follow.
 * Boundary: internal to `./native`. A redirect thrown or returned is a `redirect` outcome; any other throw rejects, for
 *           the screen's error state. Outside links (`navigate(url, { external: true })`) open through `openUrl`.
 * Runtime: react-native
 * Governing contract: ADR 0294 (decision 16); ADR 0165 (React Navigation on mobile).
 */
import type { AnyClass, Container } from "@stackra/container";
import { kindOf } from "@stackra/container";
import type { Locale } from "@stackra/i18n";

import type { Layout } from "#core/bases/layout.base";
import type { Route } from "#core/bases/route.base";
import { createRouteContext } from "#core/functions/create-route-context.function";
import { fillPath } from "#core/functions/fill-path.function";
import { instanceOf } from "#core/functions/instance-of.function";
import { isRouteRedirect } from "#core/functions/is-route-redirect.function";
import { isRouteResponse } from "#core/functions/is-route-response.function";
import { loadRoute } from "#core/functions/load-route.function";
import type { NativeLoad } from "#native/screen/native-load.type";

/** The route's path with `params`, or `/` when it has none or a param is missing. */
function pathOf(type: AnyClass, params: Readonly<Record<string, unknown>>): string {
  const pattern = kindOf(type)?.options["path"];
  if (typeof pattern !== "string") return "/";
  try {
    return fillPath(pattern, params);
  } catch {
    return "/"; // a deep link without its param: the params shape refuses it next
  }
}

/**
 * Runs the loader of `type` for a native screen.
 *
 * @throws the loader's error (a 404 `RouteResponse` for params the route's shape refuses).
 * @example
 * const outcome = await nativeLoad(OrderDetailRoute, { container, locale, params: route.params, openUrl });
 */
export async function nativeLoad(
  type: AnyClass<Route | Layout>,
  input: {
    readonly container: Container;
    readonly locale: Locale;
    readonly params: Readonly<Record<string, unknown>>;
    readonly openUrl: (url: string) => void;
  },
): Promise<NativeLoad> {
  const request = new Request(new URL(pathOf(type, input.params), "stackra://app/"));
  try {
    const ctx = createRouteContext({
      type,
      request,
      params: input.params,
      container: input.container,
      locale: input.locale,
      navigate: (href, { external }) => {
        if (external) input.openUrl(href);
      },
    });
    const result = await loadRoute(type, instanceOf(type, input.container), ctx);
    if (isRouteRedirect(result)) return { kind: "redirect", redirect: result };
    return {
      kind: "data",
      data: isRouteResponse(result) ? result.data : result,
      params: ctx.params,
      search: ctx.search,
    };
  } catch (error) {
    if (isRouteRedirect(error)) return { kind: "redirect", redirect: error };
    throw error;
  }
}
