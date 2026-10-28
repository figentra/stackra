/**
 * Stackra file contract:
 * Purpose: `CASH_DRAWER_PLUGIN`, the build-time table of the config plugin: the drawer port families Android can link,
 *          the Gradle property keys the module's `android/build.gradle` reads, and the Sunmi printer service package
 *          Android 11+ must be allowed to see.
 * Boundary: internal data; the keys must equal what `android/build.gradle` reads. Sunmi and PAX are Android terminals,
 *           so iOS links no family.
 * Runtime: node
 * Governing contract: ADR 0478 (decisions 2 and 4); ADR 0458 (decision 2); ADR 0442 (decision 3).
 */

/** The plugin's family table and property keys. */
export const CASH_DRAWER_PLUGIN = Object.freeze({
  android: Object.freeze(["sunmi", "pax"] as const),
  property: Object.freeze({
    vendors: "stackra.cashDrawer.vendors",
    artifact: (vendor: string): string => `stackra.cashDrawer.${vendor}Artifact`,
  }),
  sunmiPrinterService: "woyou.aidlservice.jiuiv5",
});
