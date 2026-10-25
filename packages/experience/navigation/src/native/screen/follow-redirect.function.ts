/**
 * Stackra file contract:
 * Purpose: `followRedirect(navigation, redirect, openUrl)`, a route's redirect on a native screen: a route ref replaces
 *          the screen with the target's (its params kept, `search` and `hash` dropped), an outside URL opens in the
 *          system browser.
 * Boundary: internal to `./native`; a target that is neither (a web path) is not followed, since a native app has no
 *           URL router behind it.
 * Runtime: react-native
 * Governing contract: ADR 0165 (React Navigation on mobile).
 */
import { StackActions, type NavigationProp, type ParamListBase } from "@react-navigation/native";

import type { RouteRedirect } from "#core/types/route-redirect.type";

/** An absolute URL with a scheme. */
const HAS_SCHEME = /^[a-z][a-z\d+.-]*:/i;

/**
 * Follows `redirect`.
 *
 * @example
 * followRedirect(navigation, outcome.redirect, (url) => void Linking.openURL(url));
 */
export function followRedirect(
  navigation: NavigationProp<ParamListBase>,
  redirect: RouteRedirect,
  openUrl: (url: string) => void,
): void {
  const target = redirect.redirect;
  if (typeof target === "object" && "name" in target) {
    const { search: _search, hash: _hash, ...params } = redirect.params ?? {};
    navigation.dispatch(StackActions.replace(target.name, params));
  } else if (typeof target === "string" && HAS_SCHEME.test(target)) openUrl(target);
}
