/**
 * Stackra file contract:
 * Purpose: `scaleGradleProperties`, the Gradle properties the module's `android/build.gradle` reads to drop what the
 *          app's runway does not list: `stackraNativeScaleUsb=false` removes the USB serial library and its Kotlin.
 * Boundary: pure; the plugin writes the answer into the app's `gradle.properties`. Bluetooth needs no property:
 *           it is the platform's own API, so leaving it out only leaves its permissions out.
 * Runtime: node
 * Governing contract: ADR 0478 (decisions 2 and 4); ADR 0442 (decision 3).
 */

/**
 * The properties, by key.
 *
 * @example
 * scaleGradleProperties(["ble"]); // { stackraNativeScaleUsb: "false" }
 */
export function scaleGradleProperties(
  transports: readonly ("ble" | "spp" | "usb")[],
): Record<string, string> {
  return { stackraNativeScaleUsb: transports.includes("usb") ? "true" : "false" };
}
