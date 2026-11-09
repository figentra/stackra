/**
 * Stackra file contract:
 * Purpose: unit tests of `MARKET_PACKS_CONFIG_SCHEMA` (`MarketPacksConfig$`): its defaults, a known source driver only,
 *          and content hashes that are 64 lowercase hex.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decision 26); ADR 0418.
 */
import { describe, expect, it } from "@stackra/testing";

import { MARKET_PACKS_CONFIG_SCHEMA } from "#core/constants/market-packs-config-schema.constant";

describe("MARKET_PACKS_CONFIG_SCHEMA", () => {
  it("fills every default", () => {
    expect(MARKET_PACKS_CONFIG_SCHEMA.parse({})).toEqual({
      source: "store",
      packHashes: [],
      trustedKeys: {},
      environment: "dev",
      allowBundledInProduction: false,
    });
  });

  it("takes a known source and well-formed hashes only", () => {
    expect(MARKET_PACKS_CONFIG_SCHEMA.parse({ source: "memory" }).source).toBe("memory");
    expect(() => MARKET_PACKS_CONFIG_SCHEMA.parse({ source: "redis" })).toThrow();
    expect(() => MARKET_PACKS_CONFIG_SCHEMA.parse({ packHashes: ["ABC"] })).toThrow();
    expect(MARKET_PACKS_CONFIG_SCHEMA.parse({ packHashes: ["a".repeat(64)] }).packHashes).toEqual([
      "a".repeat(64),
    ]);
  });

  /** A misspelt production ("prod") must fail at boot, never run as not-production. */
  it("refuses an unknown environment", () => {
    expect(MARKET_PACKS_CONFIG_SCHEMA.parse({ environment: "production" }).environment).toBe(
      "production",
    );
    for (const environment of ["prod", "Production", "prd", ""])
      expect(() => MARKET_PACKS_CONFIG_SCHEMA.parse({ environment })).toThrow();
  });
});
