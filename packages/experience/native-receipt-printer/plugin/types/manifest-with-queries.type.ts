/**
 * Stackra file contract:
 * Purpose: `ManifestWithQueries`, the part of Expo's parsed `AndroidManifest.xml` the plugin's `addPackageQuery`
 *          touches: the manifest's `<queries>` entries.
 * Boundary: a type only; a structural slice of Expo's `AndroidManifest` type, so the helper tests on plain objects.
 * Runtime: node
 * Governing contract: ADR 0478 (decision 2); ADR 0458 (decision 2).
 */

/** The part of Expo's parsed `AndroidManifest.xml` this function touches. */
export interface ManifestWithQueries {
  manifest: {
    queries?: Array<{ package?: Array<{ $: { "android:name": string } }> }>;
  };
}
