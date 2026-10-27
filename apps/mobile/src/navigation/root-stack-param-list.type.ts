/**
 * Stackra file contract:
 * Purpose: `RootStackParamList`: the root stack: the tab shell and the item detail screen.
 * Boundary: a type only, in its own file.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rule 10); React Navigation static typing.
 */
import type { NavigatorScreenParams } from "@react-navigation/native";
import type { TabParamList } from "./tab-param-list.type";

/** The root stack: the tab shell and the item detail screen. */
export type RootStackParamList = {
  /** The tab shell, whose params are the tab routes'. */
  Tabs: NavigatorScreenParams<TabParamList>;
  /** Dynamic route: deep link `stackra://items/<id>`. */
  Item: { id: string };
};
