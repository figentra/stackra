/**
 * Stackra file contract:
 * Purpose: unit and type tests of `DatabaseConfigOptions`: its initializers equal the shipped schema's defaults (a two
 *          second, critical probe, the pg pool defaults, a five-second read-your-writes window), its fields match the schema's output type exactly, and it registers that schema.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decision 26); ADR 0473.
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";
import { schemaOf } from "@stackra/validation";
import type { Assert, Fields, Same } from "@stackra/validation";
import type { z } from "zod";

import { DATABASE_CONFIG_SCHEMA } from "#core/constants/database-config-schema.constant";
import { DatabaseConfigOptions } from "#core/schemas/database-config-options.schema";

/** The check gen writes for a shape and its schema. */
type DatabaseConfigOptions$Check = Assert<
  Same<z.output<typeof DATABASE_CONFIG_SCHEMA>, Fields<DatabaseConfigOptions>>
>;

/** The health timeout the shipped schema reads from `timeout`. */
function timeoutOf(timeout: string): string {
  return DATABASE_CONFIG_SCHEMA.parse({ health: { timeout } }).health.timeout;
}

describe("DatabaseConfigOptions", () => {
  it("has the schema's defaults as its initializers", () => {
    expect({ ...new DatabaseConfigOptions() }).toEqual(DATABASE_CONFIG_SCHEMA.parse({}));
    expect(DATABASE_CONFIG_SCHEMA.parse({})).toEqual({
      health: { timeout: "PT2S", critical: true },
      timeouts: { statement: "PT30S", lock: "PT10S", idleInTransaction: "PT1M" },
      pool: { max: 10, min: 0, idleTimeout: "PT10S" },
      readYourWrites: "PT5S",
    });
  });

  it("matches its schema's output type exactly", () => {
    expectTypeOf<DatabaseConfigOptions$Check>().toEqualTypeOf<true>();
  });

  it("registers its schema for itself", () => {
    expect(schemaOf(DatabaseConfigOptions)).toBe(DATABASE_CONFIG_SCHEMA);
  });

  it("reads a health timeout in either duration form into the canonical one, and refuses one that is not a duration", () => {
    expect(timeoutOf("PT1S")).toBe("PT1S");
    expect(timeoutOf("1500ms")).toBe("PT1.5S");
    expect(DATABASE_CONFIG_SCHEMA.safeParse({ health: { timeout: "one second" } }).success).toBe(
      false,
    );
  });
});
