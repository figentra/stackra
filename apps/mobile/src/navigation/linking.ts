/**
 * Stackra file contract:
 * Purpose: the deep-link map from URLs to screens.
 * Boundary: the linking config only; it does not register navigators or screens.
 * Runtime: react-native
 * Governing contract: ADR 0007 (documentation).
 */
import type { LinkingOptions } from "@react-navigation/native";
import * as Linking from "expo-linking";

import type { RootStackParamList } from "./types";

/** URL ↔ screen map (code-based routing has no file paths to infer it from). */
export const linking: LinkingOptions<RootStackParamList> = {
  prefixes: [Linking.createURL("/")],
  config: {
    screens: {
      Tabs: {
        screens: {
          HomeTab: { screens: { Home: "" } },
          SettingsTab: { screens: { Settings: "settings" } },
        },
      },
      Item: "items/:id",
    },
  },
};
