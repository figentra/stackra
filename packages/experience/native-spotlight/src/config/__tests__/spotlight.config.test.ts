/**
 * Stackra file contract:
 * Purpose: unit tests of `SpotlightConfig`: keyed `native-spotlight.spotlight`, built with its defaults (on, no kinds,
 *          50 records, 30 days), overridden by a host, and refusing an out-of-range cap.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decisions 19 and 20).
 */
import { buildConfig, ConfigInvalidError, configKey } from "@stackra/config";
import { describe, expect, it } from "@stackra/testing";

import { SpotlightConfig as BaseSpotlightConfig } from "#config/spotlight.config";

/** A host's override: customers and orders, the newest 20. */
class SpotlightConfig extends BaseSpotlightConfig {
  override kinds = ["crm.customer", "sales.order"];

  override maxItems = 20;
}

/** A host's override with a cap above the limit. */
class TooManyConfig extends BaseSpotlightConfig {
  override maxItems = 5000;
}

describe("SpotlightConfig", () => {
  it("is keyed native-spotlight.spotlight", () => {
    expect(configKey(BaseSpotlightConfig, "native-spotlight")).toBe("native-spotlight.spotlight");
  });

  it("builds with its defaults, indexing no kind", () => {
    const config = buildConfig(BaseSpotlightConfig);
    expect(config.isEnabled).toBe(true);
    expect(config.kinds).toEqual([]);
    expect(config.maxItems).toBe(50);
    expect(config.maxAgeDays).toBe(30);
  });

  it("takes a host's override and refuses a cap above 500", () => {
    const config = buildConfig(SpotlightConfig);
    expect(config.kinds).toEqual(["crm.customer", "sales.order"]);
    expect(config.maxItems).toBe(20);
    expect(() => buildConfig(TooManyConfig)).toThrow(ConfigInvalidError);
  });
});
