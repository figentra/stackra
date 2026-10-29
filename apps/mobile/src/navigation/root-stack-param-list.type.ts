/**
 * Stackra file contract:
 * Purpose: `RootStackParamList`: the root stack: the tab shell, the item detail screen and the share inbox.
 * Boundary: a type only, in its own file.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rule 10); React Navigation static typing.
 */
import type { NavigatorScreenParams } from "@react-navigation/native";
import type { TabParamList } from "./tab-param-list.type";

/** The root stack: the tab shell, the item detail screen and the share inbox. */
export type RootStackParamList = {
  /** The tab shell, whose params are the tab routes'. */
  Tabs: NavigatorScreenParams<TabParamList>;
  /** Dynamic route: deep link `stackra://items/<id>`. */
  Item: { id: string };
  /** What other apps shared into this one: deep link `stackra://expo-sharing` (expo-sharing's share extension). */
  ShareInbox: undefined;
};
