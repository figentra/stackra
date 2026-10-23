/**
 * Stackra file contract:
 * Purpose: the deep-link map from URLs to screens.
 * Boundary: the linking config only; it does not register navigators or screens.
 * Runtime: react-native
 * Governing contract: ADR 0007 (documentation).
 */
import type { LinkingOptions, PathConfig } from "@react-navigation/native";
import * as Linking from "expo-linking";

import type { RootStackParamList, SettingsStackParamList } from "./types";

/**
 * The Settings tab's paths. Typed against its own param list: React Navigation's nested-config inference does not
 * reach a third level (root stack, tabs, stack), so written inline its `initialRouteName` is typed as `undefined`.
 */
const SETTINGS_TAB_LINKS: PathConfig<SettingsStackParamList> = {
  // A deep link into a design-system page keeps Settings underneath it, so back works.
  initialRouteName: "Settings",
  screens: {
    Settings: "settings",
    DesignSystem: "design-system",
    ProProgressButton: "design-system/pro/progress-button",
    ProSlideButton: "design-system/pro/slide-button",
    ProSwipeableRow: "design-system/pro/swipeable-row",
    ProCalendar: "design-system/pro/calendar",
    ProDatePicker: "design-system/pro/date-picker",
    ProNumberField: "design-system/pro/number-field",
  },
};

/** URL ↔ screen map (code-based routing has no file paths to infer it from). */
export const linking: LinkingOptions<RootStackParamList> = {
  prefixes: [Linking.createURL("/")],
  config: {
    screens: {
      Tabs: {
        screens: {
          HomeTab: { screens: { Home: "" } },
          SettingsTab: SETTINGS_TAB_LINKS,
        },
      },
      Item: "items/:id",
    },
  },
};
