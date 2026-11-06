/**
 * Stackra file contract:
 * Purpose: unit tests of `environmentSizesOf`: production runs at launch and every other environment at staging
 *          unless it names a tier; an environment's own `shared.database`, `shared.cache` and `shared.network` keys
 *          win over its tier; a cache switched to nodes without a class takes growth's; and no tier's cache class is a
 *          node family the UAE region lacks.
 * Boundary: test only; plain runways through `parseRunway`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0524.
 */
import { describe, expect, it } from "@stackra/testing";

import { TIER_SIZES } from "#core/constants/tier-sizes.constant";
import { environmentSizesOf } from "#core/functions/environment-sizes-of.function";
import { parseRunway } from "#core/functions/parse-runway.function";

/** A product root runway whose environments are `environments`. */
const root = (environments: Record<string, unknown>) =>
  parseRunway("root", {
    version: 3,
    project: "figentra-pay",
    product: { key: "pay" },
    environments,
  });

describe("environmentSizesOf", () => {
  it("runs production at launch and staging at staging by default", () => {
    const parsed = root({ staging: { region: "me" }, production: { region: "me" } });
    expect(environmentSizesOf(parsed, "production")).toEqual(TIER_SIZES.launch);
    expect(environmentSizesOf(parsed, "staging")).toEqual(TIER_SIZES.staging);
    expect(environmentSizesOf(parsed, "dev").tier).toBe("staging");
  });

  it("takes a named tier and the environment's own keys over it", () => {
    const parsed = root({
      production: {
        region: "me",
        tier: "growth",
        shared: {
          database: { class: "db.m7g.xlarge", storageGb: 400 },
          network: { natGateways: 2 },
        },
      },
    });
    const sizes = environmentSizesOf(parsed, "production");
    expect(sizes.tier).toBe("growth");
    expect(sizes.database).toEqual({ class: "db.m7g.xlarge", multiAz: true, storageGb: 400 });
    expect(sizes.cache).toEqual({ mode: "nodes", class: "cache.m7g.large", nodes: 2 });
    expect(sizes.network.natGateways).toBe(2);
  });

  it("gives a cache switched to nodes growth's class and count", () => {
    const parsed = root({ staging: { region: "me", shared: { cache: { mode: "nodes" } } } });
    expect(environmentSizesOf(parsed, "staging").cache).toEqual({
      mode: "nodes",
      class: "cache.m7g.large",
      nodes: 2,
    });
  });

  it("keeps every tier's cache off the node families me-central-1 lacks", () => {
    for (const sizes of Object.values(TIER_SIZES))
      expect(sizes.cache.class ?? "").not.toMatch(/^cache\.(?:t4g|m6g)\./);
  });
});
