/**
 * Stackra file contract:
 * Purpose: unit tests of `SentryOptions` and `SENTRY_CONFIG_SCHEMA`: the shape is registered with the shipped schema
 *          and its initializers equal the schema's defaults.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decision 26).
 */
import { describe, expect, it } from "@stackra/testing";
import { Schema, schemaOf } from "@stackra/validation";

import { SENTRY_CONFIG_SCHEMA } from "#core/constants/sentry-config-schema.constant";
import { SentryOptions } from "#core/schemas/sentry-options.schema";

describe("SentryOptions", () => {
  it("is a shape registered with the shipped schema", () => {
    expect(new SentryOptions()).toBeInstanceOf(Schema);
    expect(schemaOf(SentryOptions)).toBe(SENTRY_CONFIG_SCHEMA);
  });

  it("has initializers equal to the shipped defaults", () => {
    expect({ ...new SentryOptions() }).toEqual(SENTRY_CONFIG_SCHEMA.parse({}));
    expect(SENTRY_CONFIG_SCHEMA.parse({})).toEqual({
      dsnSecret: "SENTRY_DSN",
      environment: "",
      release: "",
      sampleRate: 1,
    });
  });
});
