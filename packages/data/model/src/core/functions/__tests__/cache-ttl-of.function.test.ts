/**
 * Stackra file contract:
 * Purpose: unit tests of `cacheTtlOf`: the `Cached` lifetime, nothing for an uncached model, and a refusal for a cached
 *          model with encrypted fields.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0150 (decision 5); data-layer gap ca5.
 */
import { Duration } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { Model } from "#core/bases/model.base";
import { cacheTtlOf } from "#core/functions/cache-ttl-of.function";
import { Cached } from "#core/traits/cached.trait";
import { HasEncryptedFields } from "#core/traits/has-encrypted-fields.trait";
import { Timestamps } from "#core/traits/timestamps.trait";

class Product extends Model.with(Timestamps, Cached({ ttl: Duration.minutes(5) })) {}

class Plain extends Model.with(Timestamps) {}

class Patient extends Model.with(
  HasEncryptedFields("diagnosis"),
  Cached({ ttl: Duration.minutes(5) }),
) {}

describe("cacheTtlOf", () => {
  it("reads the Cached lifetime", () => {
    expect(cacheTtlOf(Product)).toBe(Duration.minutes(5));
  });

  it("answers undefined for a model without Cached", () => {
    expect(cacheTtlOf(Plain)).toBeUndefined();
  });

  it("refuses a cached model with encrypted fields", () => {
    expect(() => cacheTtlOf(Patient)).toThrow(TypeError);
  });
});
