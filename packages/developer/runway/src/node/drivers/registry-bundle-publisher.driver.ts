/**
 * Stackra file contract:
 * Purpose: `RegistryBundlePublisherDriver`, the OS registry place of the `ExtensionBundlePublisher` port. The OS
 *          registry's publish API and asset store have no client in `@stackra/runway`, so every call throws
 *          `RunwayNotConfiguredError` naming what to bind instead.
 * Boundary: never publishes; it exists so the release wiring names the publisher and fails loudly rather than
 *           skipping a bundle. A caller binds an `ExtensionBundlePublisher` driver over the registry's publish API.
 * Runtime: node
 * Governing contract: ADR 0436 (decision 4), ADR 0109 (manifests published by CI), ADR 0263.
 */
import { RunwayNotConfiguredError } from "#core/errors/runway-not-configured.error";
import { ExtensionBundlePublisher } from "#core/ports/extension-bundle-publisher.port";
import type { ExtensionBundle } from "#core/types/extension-bundle.type";
import type { PublishedBundle } from "#core/types/published-bundle.type";

/**
 * The OS registry publisher, not wired yet.
 *
 * @example
 * await publishExtensionBundles(root, sha, new RegistryBundlePublisherDriver(), { opsApproved: false });
 * // throws RunwayNotConfiguredError
 */
export class RegistryBundlePublisherDriver extends ExtensionBundlePublisher {
  /** Throws `RunwayNotConfiguredError`. */
  override publish(_bundle: ExtensionBundle): Promise<PublishedBundle> {
    return Promise.reject(
      new RunwayNotConfiguredError(
        "ExtensionBundlePublisher",
        "@stackra/runway carries no OS registry client; bind an ExtensionBundlePublisher driver over the registry's publish API",
      ),
    );
  }
}
