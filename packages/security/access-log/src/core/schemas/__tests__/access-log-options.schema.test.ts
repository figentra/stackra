/**
 * Stackra file contract:
 * Purpose: unit tests of `AccessLogOptions`: a shape registered with the shipped schema, whose initializers equal the
 *          shipped defaults, and whose `sink` is typed as the `AccessLogSink` driver names.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decisions 19 and 26).
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";
import { Schema, schemaOf } from "@stackra/validation";

import { ACCESS_LOG_CONFIG_SCHEMA } from "#core/constants/access-log-config-schema.constant";
import { AccessLogOptions } from "#core/schemas/access-log-options.schema";

describe("AccessLogOptions", () => {
  it("is a shape registered with the shipped schema", () => {
    expect(new AccessLogOptions()).toBeInstanceOf(Schema);
    expect(schemaOf(AccessLogOptions)).toBe(ACCESS_LOG_CONFIG_SCHEMA);
  });

  it("has initializers equal to the shipped defaults", () => {
    expect({ ...new AccessLogOptions() }).toEqual(ACCESS_LOG_CONFIG_SCHEMA.parse({}));
  });

  it("types sink as the AccessLogSink driver names", () => {
    expectTypeOf<AccessLogOptions["sink"]>().toEqualTypeOf<"postgres" | "memory">();
  });
});
