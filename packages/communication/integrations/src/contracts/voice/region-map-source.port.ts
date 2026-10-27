/**
 * Stackra file contract:
 * Purpose: `RegionMapSource`, the port the region-map `ProviderDefaults` driver reads through: the data region of the
 *          running call, a region's `region-map:<region>.providers.<capability>` list, and the platform Connection a
 *          region's provider runs on in this deployment.
 * Boundary: an abstract class that is its own token, key `integrations.RegionMapSource`. The host (the OS tenancy and
 *           markets service) binds it over the `region-map` seed records and its platform Connection configuration;
 *           this package reads no record itself (ADR 0376 decision 4). It serves the capabilities that depend on where
 *           a tenant's data lives (speech first; mail, AI and storage per ADR 0376 decision 2). A leaf file.
 * Runtime: isomorphic
 * Governing contract: ADR 0376 (decisions 2, 4 and 7); R3-SO-11 (speech provider from the region map); ADR 0294
 *                     (decision 16).
 */
import { Port } from "@stackra/contracts";

/**
 * Region-map providers, from the host.
 *
 * @example
 * export class OsRegionMapSourceDriver extends Driver(RegionMapSource) { … }
 */
export abstract class RegionMapSource extends Port {
  /** Type-only port key. */
  declare readonly "~key": "integrations.RegionMapSource";

  /** The data region of the running call's tenant (`me-central-1`), or undefined outside a tenant. */
  abstract region(): string | undefined;

  /**
   * The raw `providers.<capability>` list of `region`'s region-map record, as stored (provider codes, or objects with
   * `provider` and `status`); undefined when the record has none.
   */
  abstract providers(capability: string, region: string): Promise<unknown>;

  /**
   * The platform Connection that serves `provider` for `capability` in `region`, or undefined when the platform runs
   * none there.
   */
  abstract platformConnection(
    capability: string,
    region: string,
    provider: string,
  ): Promise<string | undefined>;
}
