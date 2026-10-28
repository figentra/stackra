/**
 * Stackra file contract:
 * Purpose: unit tests of `@ConsumesChanges`: it records the watched model (or models) on a service class and refuses a
 *          class of another kind.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decision 6); data-layer gap cdc2.
 */
import { Service } from "@stackra/container";
import { describe, expect, it } from "@stackra/testing";

import { ConsumesChanges } from "#core/decorators/consumes-changes.decorator";

class Product {}

class Variant {}

@ConsumesChanges(Product)
class ProductFeedService extends Service {}

@ConsumesChanges([Product, Variant])
class CatalogueFeedService extends Service {}

describe("ConsumesChanges", () => {
  it("records the watched models on a service", () => {
    expect(ConsumesChanges.on(ProductFeedService)).toBe(Product);
    expect(ConsumesChanges.on(CatalogueFeedService)).toEqual([Product, Variant]);
  });

  it("refuses a class that is not a service", () => {
    expect(() => ConsumesChanges(Product)(class Plain {})).toThrow(TypeError);
  });
});
