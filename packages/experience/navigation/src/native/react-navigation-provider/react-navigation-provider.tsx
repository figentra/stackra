/**
 * Stackra file contract:
 * Purpose: the native `ReactNavigationProvider`: fills the `RouterProvider` seam of `@stackra/ui` with React
 *          Navigation 7's `useLinkTo()`, so every `Link` with an internal `href` opens that path through the app's
 *          `linking` config, with no navigation import in `@stackra/ui`.
 * Boundary: context glue only; mount it once inside the `NavigationContainer`. An external link keeps going to the
 *           system browser.
 * Runtime: react-native
 * Governing contract: ADR 0317 (decision 2); ADR 0303 (decision 1: `@stackra/ui` is router-free); owner decision 1 of
 *          STA-350.
 */
import { useLinkTo } from "@react-navigation/native";
import { RouterProvider } from "@stackra/ui/native";
import type { ReactElement } from "react";

import type { ReactNavigationProviderProps } from "#native/react-navigation-provider/react-navigation-provider.props";

/** Gives every `Link` below it React Navigation's link-to function. */
export function ReactNavigationProvider({ children }: ReactNavigationProviderProps): ReactElement {
  const linkTo = useLinkTo();
  return <RouterProvider navigate={linkTo}>{children}</RouterProvider>;
}
