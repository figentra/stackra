/**
 * Stackra file contract:
 * Purpose: `withNativeScale`, the config plugin of @stackra/native-scale (ADR 0478 decision 2): on iOS it sets the
 *          Bluetooth usage text when `ble` is kept; on Android it adds the Bluetooth permissions and the optional
 *          Bluetooth LE and USB host features of the kept transports, and writes the Gradle property that removes
 *          the USB serial library when `usb` is not kept.
 * Boundary: build time only, in Expo CLI at prebuild; it edits the generated native projects and never the app's
 *           source. It only adds: an entry already present is left as it is.
 * Runtime: node
 * Governing contract: ADR 0478 (decisions 2 to 4); ADR 0442 (decision 3).
 */
// The extension is required: Expo CLI loads the built plugin as Node ESM, and `expo` has no exports map.
import configPlugins from "expo/config-plugins.js";
import type { ConfigPlugin } from "expo/config-plugins.js";

import { scaleAndroidPermissions } from "./functions/scale-android-permissions.function";
import { scaleGradleProperties } from "./functions/scale-gradle-properties.function";
import type { NativeScalePluginProps } from "./types/native-scale-plugin-props.type";

const { withAndroidManifest, withGradleProperties, withInfoPlist } = configPlugins;

/** A manifest entry as the config plugins read it. */
type ManifestEntry = { $: Record<string, string> };

/** The default iOS Bluetooth usage text. */
const BLUETOOTH_USAGE = "Bluetooth connects this device to the scale at the counter.";

/**
 * The config plugin.
 *
 * @example
 * // app.config.ts
 * plugins: [["@stackra/native-scale", { transports: ["ble", "usb"] }]]
 */
export const withNativeScale: ConfigPlugin<NativeScalePluginProps | undefined> = (
  config,
  props,
) => {
  const transports = props?.transports ?? ["ble", "spp", "usb"];
  let next = config;
  if (transports.includes("ble"))
    next = withInfoPlist(next, (mod) => {
      mod.modResults["NSBluetoothAlwaysUsageDescription"] ??=
        props?.bluetoothUsage ?? BLUETOOTH_USAGE;
      return mod;
    });
  next = withAndroidManifest(next, (mod) => {
    const manifest = mod.modResults.manifest as unknown as Record<
      string,
      ManifestEntry[] | undefined
    >;
    const permissions = (manifest["uses-permission"] ??= []);
    for (const permission of scaleAndroidPermissions(transports)) {
      if (permissions.some((entry) => entry.$["android:name"] === permission.name)) continue;
      permissions.push({
        $: {
          "android:name": permission.name,
          ...(permission.maxSdkVersion === undefined
            ? {}
            : { "android:maxSdkVersion": String(permission.maxSdkVersion) }),
        },
      });
    }
    const features = (manifest["uses-feature"] ??= []);
    const wanted = [
      ...(transports.includes("ble") ? ["android.hardware.bluetooth_le"] : []),
      ...(transports.includes("usb") ? ["android.hardware.usb.host"] : []),
    ];
    for (const feature of wanted)
      if (!features.some((entry) => entry.$["android:name"] === feature))
        features.push({ $: { "android:name": feature, "android:required": "false" } });
    return mod;
  });
  return withGradleProperties(next, (mod) => {
    for (const [key, value] of Object.entries(scaleGradleProperties(transports))) {
      const existing = mod.modResults.find((item) => item.type === "property" && item.key === key);
      if (existing === undefined) mod.modResults.push({ type: "property", key, value });
      else if (existing.type === "property") existing.value = value;
    }
    return mod;
  });
};
