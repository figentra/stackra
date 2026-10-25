/**
 * Stackra file contract:
 * Purpose: unit and type tests of `FeatureFlagsOptions` and its shipped schema `FEATURE_FLAGS_CONFIG_SCHEMA`: the
 *          initializers equal the schema's defaults, a value key that is not a flag key, an unknown driver, an unknown
 *          targeting and a refresh under a second are refused, and the driver field is typed by the port's names.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decisions 4 and 26); ADR 0213 (decision 3).
 */
import type { DriverName } from "@stackra/container";
import { Duration } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";
import { schemaOf } from "@stackra/validation";

import type { FlagProvider } from "#contracts/ports/flag-provider.port";
import { FEATURE_FLAGS_CONFIG_SCHEMA } from "#core/constants/feature-flags-config-schema.constant";
import { FeatureFlagsOptions } from "#core/schemas/feature-flags-options.schema";

describe("FeatureFlagsOptions", () => {
  it("has the schema's defaults as its initializers", () => {
    expect({ ...new FeatureFlagsOptions() }).toEqual(FEATURE_FLAGS_CONFIG_SCHEMA.parse({}));
    expect(FEATURE_FLAGS_CONFIG_SCHEMA.parse({})).toEqual({
      provider: "config",
      values: {},
      targeting: "user",
      refreshEvery: Duration.minutes(5),
      posthogKey: null,
      posthogHost: "https://eu.i.posthog.com",
    });
  });

  it("registers the shipped schema for itself", () => {
    expect(schemaOf(FeatureFlagsOptions)).toBe(FEATURE_FLAGS_CONFIG_SCHEMA);
  });

  it("takes flag keys as value keys and refuses anything else", () => {
    expect(
      FEATURE_FLAGS_CONFIG_SCHEMA.parse({ values: { "web.help_centre": true } }).values,
    ).toEqual({
      "web.help_centre": true,
    });
    expect(FEATURE_FLAGS_CONFIG_SCHEMA.safeParse({ values: { help_centre: true } }).success).toBe(
      false,
    );
    expect(FEATURE_FLAGS_CONFIG_SCHEMA.safeParse({ values: { "Web.Help": true } }).success).toBe(
      false,
    );
  });

  it("refuses an unknown driver or targeting", () => {
    expect(FEATURE_FLAGS_CONFIG_SCHEMA.safeParse({ provider: "redis" }).success).toBe(false);
    expect(FEATURE_FLAGS_CONFIG_SCHEMA.safeParse({ targeting: "device" }).success).toBe(false);
    expect(FEATURE_FLAGS_CONFIG_SCHEMA.parse({ targeting: "visitor" }).targeting).toBe("visitor");
  });

  it("takes a refresh of a second or more only", () => {
    expect(
      FEATURE_FLAGS_CONFIG_SCHEMA.parse({ refreshEvery: Duration.seconds(60) }).refreshEvery,
    ).toBe("PT1M");
    expect(
      FEATURE_FLAGS_CONFIG_SCHEMA.safeParse({ refreshEvery: Duration.seconds(0.5) }).success,
    ).toBe(false);
    expect(FEATURE_FLAGS_CONFIG_SCHEMA.safeParse({ refreshEvery: "soon" }).success).toBe(false);
  });

  it("types the driver field by the port's driver names", () => {
    expectTypeOf<FeatureFlagsOptions["provider"]>().toEqualTypeOf<DriverName<FlagProvider>>();
    expectTypeOf<FeatureFlagsOptions["provider"]>().toEqualTypeOf<"config" | "posthog">();
  });
});
