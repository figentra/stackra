/**
 * Stackra file contract:
 * Purpose: `applyAndroidManifest`, the plugin's `AndroidManifest.xml` edit: the Bluetooth, location and NFC
 *          permissions Stripe Terminal needs (the legacy Bluetooth ones capped at SDK 30) and the NFC and Bluetooth LE
 *          features declared as not required.
 * Boundary: edits the parsed manifest in place and adds each element once; an element the app already declares is
 *           kept as it is.
 * Runtime: node
 * Governing contract: ADR 0479 (decision 6).
 */
import { CARD_TERMINAL_PLUGIN } from "#plugin/constants/card-terminal-plugin.constant";
import type { AndroidManifestShape } from "#plugin/types/android-manifest-shape.type";

/**
 * Adds the card terminal's permissions and features to `manifest`.
 *
 * @example
 * applyAndroidManifest(config.modResults);
 */
export function applyAndroidManifest(manifest: AndroidManifestShape): void {
  const permissions = (manifest.manifest["uses-permission"] ??= []);
  for (const permission of CARD_TERMINAL_PLUGIN.androidPermissions) {
    if (permissions.some((element) => element.$["android:name"] === permission.name)) continue;
    permissions.push({
      $: {
        "android:name": permission.name,
        ...("maxSdkVersion" in permission
          ? { "android:maxSdkVersion": permission.maxSdkVersion }
          : {}),
      },
    });
  }
  const features = (manifest.manifest["uses-feature"] ??= []);
  for (const name of CARD_TERMINAL_PLUGIN.androidFeatures) {
    if (features.some((element) => element.$["android:name"] === name)) continue;
    features.push({ $: { "android:name": name, "android:required": "false" } });
  }
}
