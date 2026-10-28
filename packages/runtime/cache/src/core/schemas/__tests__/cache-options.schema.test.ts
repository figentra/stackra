/**
 * Stackra file contract:
 * Purpose: unit and type tests of `CacheOptions` and its shipped schema: the class's initializers equal the schema's
 *          defaults, the schema's output is exactly the class's fields (the generated `X$Check`), the schema is
 *          registered for the class, the driver, namespace, lock and metrics fields take exactly their driver names,
 *          `valkeyUrl` is the `CACHE_VALKEY_URL` secret, a bound below one, a fraction or an empty binding is refused,
 *          the jitter stays within 0 to 1, and the fill wait and poll read either duration form and refuse zero.
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
import { CACHE_LOCK_DRIVERS } from "#core/constants/cache-lock-drivers.constant";
import { CACHE_METRICS_DRIVERS } from "#core/constants/cache-metrics-drivers.constant";
import { CACHE_NAMESPACE_DRIVERS } from "#core/constants/cache-namespace-drivers.constant";
import { CacheOptions } from "#core/schemas/cache-options.schema";

/** The check gen writes for a shape and its schema. */
type CacheOptions$Check = Assert<Same<z.output<typeof CACHE_CONFIG_SCHEMA>, Fields<CacheOptions>>>;

describe("CacheOptions", () => {
  it("has the schema's defaults as its initializers", () => {
    expect({ ...new CacheOptions() }).toEqual(CACHE_CONFIG_SCHEMA.parse({}));
    expect(CACHE_CONFIG_SCHEMA.parse({})).toEqual({
      driver: "memory",
      namespace: "shared",
      lock: "local",
      metrics: "none",
      maxEntries: 10_000,
      jitter: 0,
      fill: { wait: "PT5S", poll: "PT0.05S" },
      valkeyUrl: "",
      valkey: { keyPrefix: "cache:" },
      postgres: { schema: "cache", sweep: 100 },
      workers: { binding: "CACHE" },
      health: { timeout: "PT2S", critical: true },
    });
  });

  it("matches its schema's output type exactly", () => {
    expectTypeOf<CacheOptions$Check>().toEqualTypeOf<true>();
  });

  it("registers its schema for itself", () => {
    expect(schemaOf(CacheOptions)).toBe(CACHE_CONFIG_SCHEMA);
  });

  it("takes exactly the shipped driver names", () => {
    expect(CACHE_DRIVERS).toEqual(["memory", "storage", "valkey", "postgres", "workers"]);
    for (const driver of CACHE_DRIVERS)
      expect(CACHE_CONFIG_SCHEMA.safeParse({ driver }).success).toBe(true);
    expect(CACHE_CONFIG_SCHEMA.safeParse({ driver: "encore" }).success).toBe(false);
  });

  it("takes exactly the namespace driver names, shared by default", () => {
    expect(CACHE_NAMESPACE_DRIVERS).toEqual(["shared", "scope"]);
    expect(CACHE_CONFIG_SCHEMA.parse({ namespace: "scope" }).namespace).toBe("scope");
    expect(CACHE_CONFIG_SCHEMA.safeParse({ namespace: "tenant" }).success).toBe(false);
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
  it("takes exactly the lock and metrics driver names", () => {
    expect(CACHE_LOCK_DRIVERS).toEqual(["local", "locks"]);
    expect(CACHE_METRICS_DRIVERS).toEqual(["none", "counting", "logger"]);
    expect(CACHE_CONFIG_SCHEMA.parse({ lock: "locks", metrics: "counting" })).toMatchObject({
      lock: "locks",
      metrics: "counting",
    });
    expect(CACHE_CONFIG_SCHEMA.safeParse({ lock: "redlock" }).success).toBe(false);
    expect(CACHE_CONFIG_SCHEMA.safeParse({ metrics: "prometheus" }).success).toBe(false);
  });

  it("keeps the jitter within 0 to 1", () => {
    expect(CACHE_CONFIG_SCHEMA.safeParse({ jitter: 0.2 }).success).toBe(true);
    expect(CACHE_CONFIG_SCHEMA.safeParse({ jitter: -0.1 }).success).toBe(false);
    expect(CACHE_CONFIG_SCHEMA.safeParse({ jitter: 1.5 }).success).toBe(false);
  });

  it("reads the fill wait and poll in either form and refuses zero or text", () => {
    expect(CACHE_CONFIG_SCHEMA.parse({ fill: { wait: "2s", poll: "PT0.1S" } }).fill).toEqual({
      wait: "PT2S",
      poll: "PT0.1S",
    });
    expect(CACHE_CONFIG_SCHEMA.safeParse({ fill: { wait: "0s" } }).success).toBe(false);
    expect(CACHE_CONFIG_SCHEMA.safeParse({ fill: { poll: "soon" } }).success).toBe(false);
  });
  it("takes a snake_case Postgres schema and a bounded sweep", () => {
    expect(CACHE_CONFIG_SCHEMA.parse({ postgres: { schema: "database" } }).postgres).toEqual({
      schema: "database",
      sweep: 100,
    });
    expect(CACHE_CONFIG_SCHEMA.safeParse({ postgres: { schema: 'cache"; drop' } }).success).toBe(
      false,
    );
    expect(CACHE_CONFIG_SCHEMA.safeParse({ postgres: { sweep: 0 } }).success).toBe(true);
    expect(CACHE_CONFIG_SCHEMA.safeParse({ postgres: { sweep: -1 } }).success).toBe(false);
  });
});
