/**
 * Stackra file contract:
 * Purpose: the `ExtensionBundlePublisher` port: publishes one surface's built extension bundle and its manifest to the
 *          OS (the asset store for the files, the registry for the manifest) and answers the version and URL the
 *          registry recorded.
 * Boundary: an abstract class that is its own token. Publishing records a release; it never moves the release
 *           pointer, which the edge projector does from the registry's release event (or Runway by hand until the
 *           projector exists). The driver locates the built files; the bundle is their description.
 * Runtime: isomorphic
 * Governing contract: ADR 0436 (decision 4: a product's CI publishes the bundle and its manifest), ADR 0109, ADR 0263
 *                     (ports resolve by type), ADR 0294 (decisions 16 and 17).
 */
import { Port } from "@stackra/contracts";

import type { ExtensionBundle } from "#core/types/extension-bundle.type";
import type { PublishedBundle } from "#core/types/published-bundle.type";

/** Where extension bundles are published. */
export abstract class ExtensionBundlePublisher extends Port {
  /**
   * Publishes `bundle`.
   *
   * @param bundle - the bundle to publish.
   * @returns the version and URL the registry recorded.
   */
  abstract publish(bundle: ExtensionBundle): Promise<PublishedBundle>;
}
