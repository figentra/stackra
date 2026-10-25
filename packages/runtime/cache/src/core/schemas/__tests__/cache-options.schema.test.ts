/**
 * Stackra file contract:
 * Purpose: unit and type tests of `CacheOptions` and its shipped schema: the class's initializers equal the schema's
 *          defaults, the schema's output is exactly the class's fields (the generated `X$Check`), the schema is
 *          registered for the class, the driver takes exactly the shipped driver names, `valkeyUrl` is the
 *          `CACHE_VALKEY_URL` secret, and a bound below one, a fraction or an empty binding is refused.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decision 26).
 */
import { Secret } from "@stackra/config";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";
import { schemaOf } from "@stackra/validation";
import type { Assert, Fields, Same } from "@stackra/validation";
import type { z } from "zod";

import { CACHE_CONFIG_SCHEMA } from "#core/constants/cache-config-schema.constant";
import { CACHE_DRIVERS } from "#core/constants/cache-drivers.constant";
import { CacheOptions } from "#core/schemas/cache-options.schema";

/** The check gen writes for a shape and its schema. */
type CacheOptions$Check = Assert<Same<z.output<typeof CACHE_CONFIG_SCHEMA>, Fields<CacheOptions>>>;

describe("CacheOptions", () => {
  it("has the schema's defaults as its initializers", () => {
    expect({ ...new CacheOptions() }).toEqual(CACHE_CONFIG_SCHEMA.parse({}));
    expect(CACHE_CONFIG_SCHEMA.parse({})).toEqual({
      driver: "memory",
      maxEntries: 10_000,
      valkeyUrl: "",
      valkey: { keyPrefix: "cache:" },
      workers: { binding: "CACHE" },
    });
  });

  it("matches its schema's output type exactly", () => {
    expectTypeOf<CacheOptions$Check>().toEqualTypeOf<true>();
  });

  it("registers its schema for itself", () => {
    expect(schemaOf(CacheOptions)).toBe(CACHE_CONFIG_SCHEMA);
  });

  it("takes exactly the shipped driver names", () => {
    expect(CACHE_DRIVERS).toEqual(["memory", "storage", "valkey", "workers"]);
    for (const driver of CACHE_DRIVERS)
      expect(CACHE_CONFIG_SCHEMA.safeParse({ driver }).success).toBe(true);
    expect(CACHE_CONFIG_SCHEMA.safeParse({ driver: "encore" }).success).toBe(false);
  });

  it("marks the Valkey URL as the CACHE_VALKEY_URL secret", () => {
    expect(Secret.members(CacheOptions)).toEqual(new Map([["valkeyUrl", "CACHE_VALKEY_URL"]]));
  });

  it("refuses an empty Workers binding name", () => {
    expect(CACHE_CONFIG_SCHEMA.safeParse({ workers: { binding: "" } }).success).toBe(false);
  });

  it("refuses a bound below one or a fraction", () => {
    expect(CACHE_CONFIG_SCHEMA.safeParse({ maxEntries: 1 }).success).toBe(true);
    expect(CACHE_CONFIG_SCHEMA.safeParse({ maxEntries: 0 }).success).toBe(false);
    expect(CACHE_CONFIG_SCHEMA.safeParse({ maxEntries: 1.5 }).success).toBe(false);
  });
});
