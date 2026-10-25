/**
 * Stackra file contract:
 * Purpose: unit and type tests of `LoggingOptions` and its shipped schema: the class's initializers equal the schema's
 *          defaults, the schema's output is exactly the class's fields (the generated `X$Check`), the schema is
 *          registered for the class, nested defaults parse on their own, a partial nested value fills its own
 *          defaults, the level codes are `LogLevel`'s and bad values are refused.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decision 26).
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";
import { schemaOf } from "@stackra/validation";
import type { Assert, Fields, Same } from "@stackra/validation";
import type { z } from "zod";

import { LOGGING_CONFIG_SCHEMA } from "#core/constants/logging-config-schema.constant";
import { LogLevel } from "#core/enums/log-level.enum";
import { LoggingOptions } from "#core/schemas/logging-options.schema";

/** The check gen writes for a shape and its schema. */
type LoggingOptions$Check = Assert<
  Same<z.output<typeof LOGGING_CONFIG_SCHEMA>, Fields<LoggingOptions>>
>;

describe("LoggingOptions", () => {
  it("has the schema's defaults as its initializers", () => {
    expect({ ...new LoggingOptions() }).toEqual(LOGGING_CONFIG_SCHEMA.parse({}));
    expect(LOGGING_CONFIG_SCHEMA.parse({})).toEqual({
      level: "info",
      channels: {},
      sampleRate: 1,
      redaction: { extraFields: [] },
    });
  });

  it("matches its schema's output type exactly", () => {
    expectTypeOf<LoggingOptions$Check>().toEqualTypeOf<true>();
  });

  it("registers its schema for itself", () => {
    expect(schemaOf(LoggingOptions)).toBe(LOGGING_CONFIG_SCHEMA);
  });

  it("gives a nested default alone and fills a partial nested value", () => {
    expect(LOGGING_CONFIG_SCHEMA.shape.redaction.parse(undefined)).toEqual({ extraFields: [] });
    expect(LOGGING_CONFIG_SCHEMA.shape.redaction.unwrap().parse({})).toEqual({ extraFields: [] });
  });

  it("takes the LogLevel codes and refuses anything else", () => {
    expect(LOGGING_CONFIG_SCHEMA.shape.level.unwrap().options).toEqual(Enum.values(LogLevel));
    expect(LOGGING_CONFIG_SCHEMA.safeParse({ level: "trace" }).success).toBe(false);
    expect(LOGGING_CONFIG_SCHEMA.safeParse({ channels: { orders: "loud" } }).success).toBe(false);
    expect(LOGGING_CONFIG_SCHEMA.safeParse({ sampleRate: 1.5 }).success).toBe(false);
    expect(LOGGING_CONFIG_SCHEMA.safeParse({ sampleRate: -0.1 }).success).toBe(false);
  });
});
