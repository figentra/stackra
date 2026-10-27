/**
 * Stackra file contract:
 * Purpose: unit tests of `RegionMapProviderDefaultsDriver`: a region's `providers.<capability>` list gives live
 *          providers in order with their platform Connection, skipping planned, malformed and repeated entries; a
 *          region without a list offers none.
 * Boundary: test only; the region-map source is an in-test stand-in over the made-up region `xx-1`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0376 (decisions 2 and 7).
 */
import { describe, expect, it } from "@stackra/testing";

import { ProviderDefaults } from "#contracts/ports/provider-defaults.port";
import { RegionMapSource } from "#contracts/voice/region-map-source.port";
import { RegionMapProviderDefaultsDriver } from "#core/voice/region-map-provider-defaults.driver";

class Regions extends RegionMapSource {
  region(): string | undefined {
    return "xx-1";
  }

  async providers(capability: string, region: string): Promise<unknown> {
    return capability === "speech" && region === "xx-1"
      ? [
          "alpha",
          { provider: "beta", status: "planned" },
          { provider: "gamma", status: "live" },
          7,
          "alpha",
        ]
      : undefined;
  }

  async platformConnection(
    _capability: string,
    _region: string,
    provider: string,
  ): Promise<string | undefined> {
    return provider === "alpha" ? "conn_alpha" : undefined;
  }
}

describe("RegionMapProviderDefaultsDriver", () => {
  const defaults = new RegionMapProviderDefaultsDriver(new Regions());

  it("is a ProviderDefaults", () => {
    expect(defaults).toBeInstanceOf(ProviderDefaults);
  });

  it("lists the region's live providers in order", async () => {
    expect(await defaults.providers("speech", "xx-1")).toEqual([
      { provider: "alpha", connectionId: "conn_alpha" },
      { provider: "gamma" },
    ]);
  });

  it("offers none without a list", async () => {
    expect(await defaults.providers("speech", "yy-2")).toEqual([]);
    expect(await defaults.providers("mail", "xx-1")).toEqual([]);
  });
});
