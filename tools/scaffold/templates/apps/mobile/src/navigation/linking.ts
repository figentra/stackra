/**
 * Stackra file contract:
 * Purpose: the URL to screen map, built from the route classes' paths. Part of the hand-written navigation that gen
 *          replaces (STA-339).
 * Boundary: configuration only; it declares no screen.
 * Runtime: react-native
 * Governing contract: ADR 0295 (decision 12); ADR 0294 (decision 14).
 */
import type { LinkingOptions } from "@react-navigation/native";
import * as Linking from "expo-linking";

import { HomeRoute } from "#src/routes/home/home.route";
import { ItemRoute } from "#src/routes/item/item.route";
import { SettingsRoute } from "#src/routes/settings/settings.route";

import type { RootStackParamList } from "./types";

/** URL ↔ screen map (code-based routing has no file paths to infer it from). */
export const linking: LinkingOptions<RootStackParamList> = {
  prefixes: [Linking.createURL("/")],
  config: {
    screens: {
      Tabs: {
        screens: {
          HomeTab: { screens: { Home: HomeRoute.path } },
          SettingsTab: { screens: { Settings: SettingsRoute.path } },
        },
      },
      Item: ItemRoute.path,
    },
  },
};
