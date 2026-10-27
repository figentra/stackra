/**
 * Stackra file contract:
 * Purpose: `EdgeBundle`, one built extension bundle found in a product checkout: the surface key of the root runway it
 *          belongs to, its folder and its manifest.
 * Boundary: type only; `readBundles` returns it, `uploadBundle` and `publishProduct` take it.
 * Runtime: node
 * Governing contract: ADR 0436 (decision 4); app-shells 4.2.
 */
import type { BundleManifest } from "#node/types/bundle-manifest.type";

/** One bundle ready to publish. */
export type EdgeBundle = {
  /** The root runway's surface key. */
  readonly surface: string;
  /** The absolute folder that holds the bundle's files (`<bundleDir>/<surface>/<version>`). */
  readonly folder: string;
  /** Its manifest. */
  readonly manifest: BundleManifest;
};
