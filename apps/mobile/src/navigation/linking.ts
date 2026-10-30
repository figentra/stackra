/**
 * Stackra file contract:
 * Purpose: the deep-link map from URLs to screens, including `stackra://expo-sharing`, where expo-sharing's share
 *          extension opens the app, to the share inbox.
 * Boundary: the linking config only; it does not register navigators or screens.
 * Runtime: react-native
 * Governing contract: ADR 0007 (documentation); showcase redesign spec (2026-10-27) section 2.2.
 */
import type { LinkingOptions, PathConfig } from "@react-navigation/native";
import * as Linking from "expo-linking";

import { COMPONENT_LINK } from "./component-link.constant";
import type { RootStackParamList } from "./root-stack-param-list.type";
import type { HomeStackParamList } from "./types";

/**
 * The Home tab's paths. Typed against its own param list: React Navigation's nested-config inference does not
 * reach a third level (root stack, tabs, stack), so written inline its `initialRouteName` is typed as `undefined`.
 */
const HOME_TAB_LINKS: PathConfig<HomeStackParamList> = {
  // A deep link into a component keeps the home underneath, so back works.
  initialRouteName: "Home",
  screens: {
    // `design-system`, the previous release's landing, opens the home too; `hero/<id>` (or `?hero=<id>`) picks the
    // landing hero.
    Home: { path: "", alias: ["design-system", "hero/:hero"] },
    // The component screen exists only where the review area does: development builds.
    ...(__DEV__ ? { Component: COMPONENT_LINK } : {}),
  },
};

/** URL ↔ screen map (code-based routing has no file paths to infer it from). */
export const linking: LinkingOptions<RootStackParamList> = {
  prefixes: [Linking.createURL("/")],
  config: {
    screens: {
      Tabs: {
        screens: {
          HomeTab: HOME_TAB_LINKS,
          SettingsTab: { screens: { Settings: "settings" } },
          // Development builds only, like the tab itself.
          ...(__DEV__ ? { SearchTab: { screens: { Search: "search" } } } : {}),
        },
      },
      Item: "items/:id",
      // expo-sharing's iOS share extension opens `<scheme>://expo-sharing` after a share.
      ShareInbox: "expo-sharing",
    },
  },
};
