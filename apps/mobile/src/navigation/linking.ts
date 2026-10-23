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
          SettingsTab: {
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
          },
        },
      },
      Item: "items/:id",
    },
  },
};
