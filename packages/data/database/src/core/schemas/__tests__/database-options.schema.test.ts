/**
 * Stackra file contract:
 * Purpose: unit and type tests of `DatabaseOptions`: its initializers equal the shipped schema's defaults (a two
 *          second, critical probe), its fields match the schema's output type exactly, and it registers that schema.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decision 26).
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";
import { schemaOf } from "@stackra/validation";
import type { Assert, Fields, Same } from "@stackra/validation";
import type { z } from "zod";

import { DATABASE_CONFIG_SCHEMA } from "#core/constants/database-config-schema.constant";
import { DatabaseOptions } from "#core/schemas/database-options.schema";

/** The check gen writes for a shape and its schema. */
type DatabaseOptions$Check = Assert<
  Same<z.output<typeof DATABASE_CONFIG_SCHEMA>, Fields<DatabaseOptions>>
>;

describe("DatabaseOptions", () => {
  it("has the schema's defaults as its initializers", () => {
    expect({ ...new DatabaseOptions() }).toEqual(DATABASE_CONFIG_SCHEMA.parse({}));
    expect(DATABASE_CONFIG_SCHEMA.parse({})).toEqual({
      health: { timeout: "PT2S", critical: true },
    });
  });

  it("matches its schema's output type exactly", () => {
    expectTypeOf<DatabaseOptions$Check>().toEqualTypeOf<true>();
  });

  it("registers its schema for itself", () => {
    expect(schemaOf(DatabaseOptions)).toBe(DATABASE_CONFIG_SCHEMA);
  });

  it("refuses a health timeout that is not an ISO 8601 duration", () => {
    expect(DATABASE_CONFIG_SCHEMA.safeParse({ health: { timeout: "PT1S" } }).success).toBe(true);
    expect(DATABASE_CONFIG_SCHEMA.safeParse({ health: { timeout: "1s" } }).success).toBe(false);
  });
});
