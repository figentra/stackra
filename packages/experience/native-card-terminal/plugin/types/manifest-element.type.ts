/**
 * Stackra file contract:
 * Purpose: `ManifestElement`, one element of Expo's parsed `AndroidManifest.xml`: its attributes under `$`.
 * Boundary: a type only; restated structurally so the plugin's functions are testable without Expo.
 * Runtime: node
 * Governing contract: ADR 0479 (decision 6).
 */

/** One manifest element. */
export interface ManifestElement {
  readonly $: Record<string, string>;
}
