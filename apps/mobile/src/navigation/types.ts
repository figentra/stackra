import type { NavigatorScreenParams } from "@react-navigation/native";

/** Every route and its params, declared once. A screen's `route.params` and every `navigate()` are typed from here. */
export type HomeStackParamList = { Home: undefined };
export type SettingsStackParamList = { Settings: undefined };

export type TabParamList = {
  HomeTab: NavigatorScreenParams<HomeStackParamList>;
  SettingsTab: NavigatorScreenParams<SettingsStackParamList>;
};

export type RootStackParamList = {
  Tabs: NavigatorScreenParams<TabParamList>;
  /** Dynamic route: deep link `stackra://items/<id>`. */
  Item: { id: string };
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
