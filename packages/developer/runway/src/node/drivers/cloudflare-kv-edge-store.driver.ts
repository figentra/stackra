/**
 * Stackra file contract:
 * Purpose: `CloudflareKvEdgeStoreDriver`, the Cloudflare KV place of the `EdgeStore` port. `@stackra/runway` has no
 *          Cloudflare SDK dependency, so every call throws `RunwayNotConfiguredError` naming what to bind instead.
 * Boundary: never writes; it exists so the deploy wiring names the KV driver and fails loudly rather than silently
 *           skipping the platform host rows. A caller binds an `EdgeStore` driver over the KV namespace's API
 *           (`@figentra/worker-edge`'s namespace, written only with Runway's credential).
 * Runtime: node
 * Governing contract: ADR 0437 (decision 6: Runway writes platform `host:` and `wellknown:` rows; only Runway's and
 *                     the projector's credentials can write the namespace), ADR 0263.
 */
import { RunwayNotConfiguredError } from "#core/errors/runway-not-configured.error";
import { EdgeStore } from "#core/ports/edge-store.port";

/** The message every call throws with. */
const NOT_CONFIGURED =
  "@stackra/runway carries no Cloudflare KV client; bind an EdgeStore driver over the edge namespace's API";

/**
 * The Cloudflare KV edge store, not wired yet.
 *
 * @example
 * await registerPlatformHosts(root, "production", new CloudflareKvEdgeStoreDriver(), signing);
 * // throws RunwayNotConfiguredError
 */
export class CloudflareKvEdgeStoreDriver extends EdgeStore {
  /** Throws `RunwayNotConfiguredError`. */
  override put(_key: string, _value: string): Promise<void> {
    return Promise.reject(new RunwayNotConfiguredError("EdgeStore", NOT_CONFIGURED));
  }

  /** Throws `RunwayNotConfiguredError`. */
  override delete(_key: string): Promise<void> {
    return Promise.reject(new RunwayNotConfiguredError("EdgeStore", NOT_CONFIGURED));
  }
}
