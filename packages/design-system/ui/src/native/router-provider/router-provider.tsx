/**
 * Stackra file contract:
 * Purpose: the native `RouterProvider`: hands `Link` the app's navigate function, so a link reaches React Navigation
 *          (bound by @stackra/navigation) without @stackra/ui importing a router. A documented adaptation of the web
 *          provider of the same name, which React Aria ships: native has no URL, so `navigate` takes the `href` only.
 * Boundary: context only; the binding lives in @stackra/navigation.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 5); owner decision 1 of STA-350 (router-aware UI
 *          lives in @stackra/navigation).
 */

import { RouterContext } from "./router-context";
import type { RouterProviderProps } from "#native/router-provider/router-provider.props";

/** Gives every `Link` below it the app's navigate function for its internal paths. */
export function RouterProvider({ navigate, children }: RouterProviderProps) {
  return <RouterContext value={navigate}>{children}</RouterContext>;
}
