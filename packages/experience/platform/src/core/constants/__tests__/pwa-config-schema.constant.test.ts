/**
 * Stackra file contract:
 * Purpose: unit tests of `PWA_CONFIG_SCHEMA` (`PwaConfig$`): its defaults equal `PwaOptions`' initializers, a nested
 *          field can be re-defaulted the way a generated override does it, and bad values are refused.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0294 (decision 26); ADR 0255.
 */
import { describe, expect, it } from "@stackra/testing";

import { PWA_CONFIG_SCHEMA } from "#core/constants/pwa-config-schema.constant";
import { PwaOptions } from "#core/schemas/pwa-options.schema";

describe("PWA_CONFIG_SCHEMA", () => {
  it("defaults to PwaOptions' initializers", () => {
    expect(PWA_CONFIG_SCHEMA.parse({})).toEqual({ ...new PwaOptions() });
  });

  it("extends a nested field over its default", () => {
    const override = PWA_CONFIG_SCHEMA.extend({
      caching: PWA_CONFIG_SCHEMA.shape.caching.unwrap().default(() => ({
        ...PWA_CONFIG_SCHEMA.shape.caching.parse(undefined),
        preset: "balanced" as const,
      })),
    });
    expect(override.parse({}).caching.preset).toBe("balanced");
  });

  it("refuses an unknown cache strategy and a route that is not a path", () => {
    const caching = PWA_CONFIG_SCHEMA.shape.caching.parse(undefined);
    expect(
      PWA_CONFIG_SCHEMA.safeParse({ caching: { ...caching, routes: { "/a/": "sometimes" } } })
        .success,
    ).toBe(false);
    expect(
      PWA_CONFIG_SCHEMA.safeParse({ caching: { ...caching, offlineFallback: "offline" } }).success,
    ).toBe(false);
  });
});
