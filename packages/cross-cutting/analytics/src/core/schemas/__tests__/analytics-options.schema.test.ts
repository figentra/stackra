/**
 * Stackra file contract:
 * Purpose: unit and type tests of `AnalyticsOptions`: a shape class whose initializers equal the shipped schema's
 *          defaults, registered with that schema when the module loads, with the field types the template's overrides
 *          restate.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0294 (decisions 4, 19 and 26); ADR 0298.
 */
import type { ConsentCategory } from "@stackra/consent";
import type { DriverName } from "@stackra/container";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";
import { schemaOf } from "@stackra/validation";

import type { AnalyticsDriver } from "#contracts/ports/analytics-driver.port";
import { ANALYTICS_CONFIG_SCHEMA } from "#core/constants/analytics-config-schema.constant";
import { AnalyticsOptions } from "#core/schemas/analytics-options.schema";

describe("AnalyticsOptions", () => {
  it("registers the shipped schema for itself", () => {
    expect(schemaOf(AnalyticsOptions)).toBe(ANALYTICS_CONFIG_SCHEMA);
  });

  it("initializes every field to the schema's default", () => {
    expect({ ...new AnalyticsOptions() }).toEqual(ANALYTICS_CONFIG_SCHEMA.parse({}));
  });

  it("types the fields the template's overrides restate", () => {
    expectTypeOf<AnalyticsOptions["driver"]>().toEqualTypeOf<DriverName<AnalyticsDriver>>();
    expectTypeOf<AnalyticsOptions["consentCategory"]>().toEqualTypeOf<ConsentCategory>();
    expectTypeOf<AnalyticsOptions["denyProperties"]>().toEqualTypeOf<string[]>();
    expectTypeOf<AnalyticsOptions["ingestOrigin"]>().toEqualTypeOf<string>();
    expectTypeOf<AnalyticsOptions["posthogKey"]>().toEqualTypeOf<string | null>();
    expectTypeOf<AnalyticsOptions["posthogHost"]>().toEqualTypeOf<string>();
  });
});
