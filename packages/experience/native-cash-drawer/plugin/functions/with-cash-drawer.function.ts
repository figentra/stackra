/**
 * Stackra file contract:
 * Purpose: `withCashDrawer`, the package's config plugin: it writes the linked drawer port families into
 *          `gradle.properties` (the module's Gradle file compiles only those families and fetches only their SDKs), adds
 *          the vendors' Maven repositories, and lets Android 11+ see the Sunmi printer service that drives the drawer.
 * Boundary: build time only, run by `expo prebuild`; it edits generated files and never the app's source. Families the
 *           runway does not list are left out of the build (ADR 0442 decision 3). iOS needs nothing: it has no drawer
 *           port family, and a drawer on an Epson or Star printer is linked by @stackra/native-receipt-printer.
 * Runtime: node
 * Governing contract: ADR 0478 (decisions 2 to 4); ADR 0442 (decision 3); ADR 0458 (decision 2).
 */
import type { ConfigPlugin } from "expo/config-plugins";
import {
  withAndroidManifest,
  withGradleProperties,
  withProjectBuildGradle,
} from "expo/config-plugins";

import { CASH_DRAWER_PLUGIN } from "#plugin/constants/cash-drawer-plugin.constant";
import { addMavenRepositories } from "#plugin/functions/add-maven-repositories.function";
import { addPackageQuery } from "#plugin/functions/add-package-query.function";
import { linkedVendors } from "#plugin/functions/linked-vendors.function";
import { setGradleProperties } from "#plugin/functions/set-gradle-properties.function";
import type { CashDrawerPluginProps } from "#plugin/types/cash-drawer-plugin-props.type";

const { property } = CASH_DRAWER_PLUGIN;

/**
 * Links the listed drawer port families into the app's Android build.
 *
 * @example
 * // app.config.ts, as gen writes it from the runway's `device:pax`
 * plugins: [["@stackra/native-cash-drawer", { vendors: ["pax"], android: { pax: { repository, coordinate } } }]]
 */
export const withCashDrawer: ConfigPlugin<CashDrawerPluginProps | undefined> = (
  config,
  props = {},
) => {
  const vendors = linkedVendors(props);

  let next = withGradleProperties(config, (mod) => {
    const entries: Record<string, string> = { [property.vendors]: vendors.join(",") };
    for (const vendor of vendors) {
      const coordinate = props.android?.[vendor]?.coordinate;
      if (coordinate !== undefined) entries[property.artifact(vendor)] = coordinate;
    }
    mod.modResults = setGradleProperties(mod.modResults, entries);
    return mod;
  });

  const repositories = vendors.flatMap((vendor) => props.android?.[vendor]?.repository ?? []);
  if (repositories.length > 0) {
    next = withProjectBuildGradle(next, (mod) => {
      mod.modResults.contents = addMavenRepositories(mod.modResults.contents, repositories);
      return mod;
    });
  }

  if (vendors.includes("sunmi")) {
    next = withAndroidManifest(next, (mod) => {
      addPackageQuery(mod.modResults, CASH_DRAWER_PLUGIN.sunmiPrinterService);
      return mod;
    });
  }

  return next;
};
