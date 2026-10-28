/**
 * Stackra file contract:
 * Purpose: `RegionMapProviderDefaultsDriver`, the `ProviderDefaults` for the capabilities that depend on where a
 *          tenant's data lives (speech): a region's `region-map:<region>.providers.<capability>` list, live entries
 *          only, in the record's order, each with the platform Connection the deployment runs for it there.
 * Boundary: the driver named `region-map`. Its "market" argument is a data region code; `SpeechService` builds its own
 *           `ProviderResolver` over it, so the market-pack driver stays the one bound for market capabilities. It
 *           reads through `RegionMapSource` and names no region and no provider. Entries follow the market-pack rule:
 *           a provider code, or an object with `provider` and `status`; a non-`live` entry is never served; a
 *           repeated provider counts once.
 *           `testDefault`: this package's own tests take it, as ProviderDefaults has no memory driver (ADR 0266 2026-10-28 note).
 * Runtime: isomorphic
 * Governing contract: ADR 0376 (decisions 2 and 7); R3-SO-11; ADR 0356 (decisions 3 and 5).
 */
import { Driver } from "@stackra/container";

import { ProviderDefaults } from "#contracts/ports/provider-defaults.port";
import type { ProviderChoice } from "#contracts/types/provider-choice.type";
import type { RegionMapSource } from "#contracts/voice/region-map-source.port";
import { liveProviderOf } from "#core/functions/live-provider-of.function";

/**
 * A region's providers for a capability, from its region-map record.
 *
 * @example
 * const choices = await defaults.providers("speech", "me-central-1"); // [{ provider: "…", connectionId: "conn_…" }]
 */
export class RegionMapProviderDefaultsDriver extends Driver(ProviderDefaults, {
  testDefault: true,
}) {
  /** The region-map records and platform Connections. */
  private readonly regions: RegionMapSource;

  /**
   * @param regions - the host's region-map source.
   */
  constructor(regions: RegionMapSource) {
    super();
    this.regions = regions;
  }

  /** The live providers `region`'s record lists for `capability`, in its order. */
  async providers(capability: string, region: string): Promise<readonly ProviderChoice[]> {
    const listed = await this.regions.providers(capability, region);
    if (!Array.isArray(listed)) return [];
    const choices: ProviderChoice[] = [];
    for (const entry of listed) {
      const provider = liveProviderOf(entry);
      if (provider === undefined || choices.some((choice) => choice.provider === provider))
        continue;
      // oxlint-disable-next-line no-await-in-loop -- one lookup per listed provider, in the record's order
      const connectionId = await this.regions.platformConnection(capability, region, provider);
      choices.push({ provider, ...(connectionId === undefined ? {} : { connectionId }) });
    }
    return choices;
  }
}
