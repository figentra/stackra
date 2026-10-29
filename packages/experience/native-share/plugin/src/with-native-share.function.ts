/**
 * Stackra file contract:
 * Purpose: `withNativeShare`, the config plugin of @stackra/native-share (ADR 0478 decision 2): it applies
 *          expo-sharing's own plugin, which adds the iOS share extension target and the Android share intent filters,
 *          with what this app takes.
 * Boundary: build time only, in Expo CLI at prebuild; it writes no native code of its own. expo-sharing must be a
 *           dependency of the app, so Expo CLI resolves its plugin from the app's folder.
 * Runtime: node
 * Governing contract: ADR 0478 (decisions 2, 3 and 9).
 */
// The extension is required: Expo CLI loads the built plugin as Node ESM, and `expo` has no exports map.
import configPlugins from "expo/config-plugins.js";
import type { ConfigPlugin } from "expo/config-plugins.js";

import { sharingPluginProps } from "./functions/sharing-plugin-props.function";
import type { NativeSharePluginProps } from "./types/native-share-plugin-props.type";

const { withPlugins } = configPlugins;

/**
 * The config plugin.
 *
 * @example
 * // app.json
 * "plugins": [["@stackra/native-share", { "fileTypes": ["image/*", "application/pdf"] }]]
 */
export const withNativeShare: ConfigPlugin<NativeSharePluginProps | undefined> = (config, props) =>
  withPlugins(config, [["expo-sharing", sharingPluginProps(props)]]);
