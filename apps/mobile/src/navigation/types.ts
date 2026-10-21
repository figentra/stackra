/**
 * Stackra file contract:
 * Purpose: the route names and their params, for every navigator in the app.
 * Boundary: types only, plus the global `ReactNavigation` augmentation; it declares no navigator.
 * Runtime: isomorphic
 * Governing contract: ADR 0007 (documentation).
 */
import type { NavigatorScreenParams } from "@react-navigation/native";

/**
 * The routes of the Home tab's stack and their params, declared once. A screen's `route.params` and every
 * `navigate()` are typed from here.
 */
export type HomeStackParamList = {
  /** The Home screen; takes no params. */
  Home: undefined;
};

/** The routes of the Settings tab's stack and their params. */
export type SettingsStackParamList = {
  /** The Settings screen; takes no params. */
  Settings: undefined;
};

/** The tab routes; each tab holds the stack of its own screens. */
export type TabParamList = {
  /** The Home tab, whose params are the Home stack's. */
  HomeTab: NavigatorScreenParams<HomeStackParamList>;
  /** The Settings tab, whose params are the Settings stack's. */
  SettingsTab: NavigatorScreenParams<SettingsStackParamList>;
};

/** The root stack: the tab shell and the item detail screen. */
export type RootStackParamList = {
  /** The tab shell, whose params are the tab routes'. */
  Tabs: NavigatorScreenParams<TabParamList>;
  /** Dynamic route: deep link `stackra://items/<id>`. */
  Item: { id: string };
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
