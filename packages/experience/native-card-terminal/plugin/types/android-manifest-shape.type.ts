/**
 * Stackra file contract:
 * Purpose: `AndroidManifestShape`, the part of Expo's parsed `AndroidManifest.xml` the plugin edits: the
 *          `uses-permission` and `uses-feature` elements.
 * Boundary: a type only; restated structurally so the plugin's functions are testable without Expo.
 * Runtime: node
 * Governing contract: ADR 0479 (decision 6).
 */
import type { ManifestElement } from "#plugin/types/manifest-element.type";

/** The parsed manifest. */
export interface AndroidManifestShape {
  readonly manifest: {
    "uses-permission"?: ManifestElement[];
    "uses-feature"?: ManifestElement[];
  };
}
