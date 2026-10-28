/**
 * Stackra file contract:
 * Purpose: `addPackageQuery`, which adds a `<queries><package android:name="..."/></queries>` entry to the app's
 *          Android manifest, so Android 11+ lets the app bind a vendor service (the Sunmi printer service).
 * Boundary: internal; it mutates the manifest object Expo hands the mod and adds the package once.
 * Runtime: node
 * Governing contract: ADR 0478 (decision 2); ADR 0458 (decision 2).
 */
import type { ManifestWithQueries } from "#plugin/types/manifest-with-queries.type";

/**
 * Adds `packageName` to the manifest's queries.
 *
 * @example
 * addPackageQuery(config.modResults, "woyou.aidlservice.jiuiv5");
 */
export function addPackageQuery<T extends ManifestWithQueries>(
  androidManifest: T,
  packageName: string,
): T {
  const queries = (androidManifest.manifest.queries ??= []);
  const listed = queries.some((query) =>
    (query.package ?? []).some((entry) => entry.$["android:name"] === packageName),
  );
  if (!listed) queries.push({ package: [{ $: { "android:name": packageName } }] });
  return androidManifest;
}
