/**
 * Stackra file contract:
 * Purpose: `withReceiptPrinter`, the package's config plugin: it writes the linked vendor families into
 *          `gradle.properties` and `Podfile.properties.json` (the module's Gradle file and podspec compile only those
 *          families and fetch only their SDKs), adds the vendors' Maven repositories, lets Android 11+ see the Sunmi
 *          printer service, and sets iOS's local network purpose string for network printers.
 * Boundary: build time only, run by `expo prebuild`; it edits generated files and never the app's source. Families the
 *           runway does not list are left out of the build (ADR 0442 decision 3). It reads no environment and holds no
 *           secret; the purpose string comes translated from the app.
 * Runtime: node
 * Governing contract: ADR 0478 (decisions 2 to 4); ADR 0442 (decision 3); ADR 0458 (decision 2).
 */
import type { ConfigPlugin } from "expo/config-plugins";
import {
  withAndroidManifest,
  withGradleProperties,
  withInfoPlist,
  withPodfileProperties,
  withProjectBuildGradle,
} from "expo/config-plugins";

import { RECEIPT_PRINTER_PLUGIN } from "#plugin/constants/receipt-printer-plugin.constant";
import { addMavenRepositories } from "#plugin/functions/add-maven-repositories.function";
import { addPackageQuery } from "#plugin/functions/add-package-query.function";
import { linkedVendors } from "#plugin/functions/linked-vendors.function";
import { setGradleProperties } from "#plugin/functions/set-gradle-properties.function";
import type { ReceiptPrinterPluginProps } from "#plugin/types/receipt-printer-plugin-props.type";

const { property } = RECEIPT_PRINTER_PLUGIN;

/**
 * Links the listed receipt printer families into the app's native build.
 *
 * @example
 * // app.config.ts, as gen writes it from the runway's `device:sunmi`
 * plugins: [["@stackra/native-receipt-printer", { vendors: ["sunmi"] }]]
 */
export const withReceiptPrinter: ConfigPlugin<ReceiptPrinterPluginProps | undefined> = (
  config,
  props = {},
) => {
  const android = linkedVendors(props, "android");
  const ios = linkedVendors(props, "ios");

  let next = withGradleProperties(config, (mod) => {
    const entries: Record<string, string> = { [property.vendors]: android.join(",") };
    for (const vendor of android) {
      const coordinate = props.android?.[vendor]?.coordinate;
      if (coordinate !== undefined) entries[property.artifact(vendor)] = coordinate;
    }
    mod.modResults = setGradleProperties(mod.modResults, entries);
    return mod;
  });

  const repositories = android.flatMap((vendor) => props.android?.[vendor]?.repository ?? []);
  if (repositories.length > 0) {
    next = withProjectBuildGradle(next, (mod) => {
      mod.modResults.contents = addMavenRepositories(mod.modResults.contents, repositories);
      return mod;
    });
  }

  if (android.includes("sunmi")) {
    next = withAndroidManifest(next, (mod) => {
      addPackageQuery(mod.modResults, RECEIPT_PRINTER_PLUGIN.sunmiPrinterService);
      return mod;
    });
  }

  next = withPodfileProperties(next, (mod) => {
    mod.modResults[property.vendors] = ios.join(",");
    if (props.ios?.epsonFramework !== undefined)
      mod.modResults[property.epsonFramework] = props.ios.epsonFramework;
    if (props.ios?.starVersion !== undefined)
      mod.modResults[property.starVersion] = props.ios.starVersion;
    return mod;
  });

  const purpose = props.localNetworkUsage;
  if (ios.length > 0 && purpose !== undefined) {
    next = withInfoPlist(next, (mod) => {
      mod.modResults.NSLocalNetworkUsageDescription = purpose;
      return mod;
    });
  }

  return next;
};
