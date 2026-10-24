/**
 * Stackra file contract:
 * Purpose: follows the `href` of a pressed native link, one rule for every component that has one: an app path goes
 *          to the app's navigate function; an absolute URL, an external link, or any `href` when there is no navigate
 *          function goes to the system through `Linking`.
 * Boundary: the one place the native components call `Linking.openURL`, so a later fix (a scheme allow-list, say) lands
 *           once. The failed-open warning never carries the URL, because it may hold a credential. It runs no `onPress`;
 *           the caller does that first.
 * Runtime: react-native
 * Governing contract: ADR 0303 (decision 5, router-free links); ADR 0314 (decisions 1 and 4).
 */
import { Linking } from "react-native";

import { isAbsoluteUrl } from "#core/functions/is-absolute-url.function";

/**
 * Opens the place an `href` names.
 * @param href - an app path or an absolute URL
 * @param navigate - the nearest `RouterProvider`'s navigate function, or null outside one
 * @param couldNotOpen - the warning logged when the system refuses the URL
 * @param isExternal - true to send even a path to the system, as an external link does
 */
export function followHref(
  href: string,
  navigate: ((href: string) => void) | null,
  couldNotOpen: string,
  isExternal = false,
): void {
  if (navigate && !isExternal && !isAbsoluteUrl(href)) {
    navigate(href);
    return;
  }
  // The URL stays out of the warning: it may hold a token.
  Linking.openURL(href).catch(() => console.warn(couldNotOpen));
}
