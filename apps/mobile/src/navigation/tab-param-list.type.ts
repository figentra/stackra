/**
 * Stackra file contract:
 * Purpose: `TabParamList`: the tab routes; each tab holds the stack of its own screens, its root when no params.
 * Boundary: a type only, in its own file.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rule 10); React Navigation static typing.
 */
import type { NavigatorScreenParams } from "@react-navigation/native";
import type { HomeStackParamList } from "./types";
import type { SettingsStackParamList } from "./settings-stack-param-list.type";
import type { SearchStackParamList } from "./search-stack-param-list.type";

/** The tab routes; each tab holds the stack of its own screens and opens at that stack's root when given no params. */
export type TabParamList = {
  /** The Home tab, whose params are the Home stack's. */
  HomeTab: NavigatorScreenParams<HomeStackParamList> | undefined;
  /** The Settings tab, whose params are the Settings stack's. */
  SettingsTab: NavigatorScreenParams<SettingsStackParamList> | undefined;
  /** The Search tab (development builds only), whose params are the Search stack's. */
  SearchTab: NavigatorScreenParams<SearchStackParamList> | undefined;
};
