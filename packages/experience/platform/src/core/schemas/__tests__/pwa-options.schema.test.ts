/**
 * Stackra file contract:
 * Purpose: unit and type tests of `PwaOptions`: a shape registered with its shipped schema, so validation finds it,
 *          with the nested types a host override restates (`BasePwaConfig["caching"]`).
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0294 (decision 26); ADR 0255.
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";
import { Schema, schemaOf } from "@stackra/validation";

import { PWA_CONFIG_SCHEMA } from "#core/constants/pwa-config-schema.constant";
import type { CachePreset } from "#core/enums/cache-preset.enum";
import type { CacheStrategy } from "#core/enums/cache-strategy.enum";
import { PwaOptions } from "#core/schemas/pwa-options.schema";

describe("PwaOptions", () => {
  it("is a shape registered with PwaConfig$", () => {
    expect(new PwaOptions()).toBeInstanceOf(Schema);
    expect(schemaOf(PwaOptions)).toBe(PWA_CONFIG_SCHEMA);
  });

  it("types the nested objects an override restates", () => {
    expectTypeOf<PwaOptions["caching"]["preset"]>().toEqualTypeOf<CachePreset>();
    expectTypeOf<PwaOptions["caching"]["routes"]>().toEqualTypeOf<Record<string, CacheStrategy>>();
  });
});
