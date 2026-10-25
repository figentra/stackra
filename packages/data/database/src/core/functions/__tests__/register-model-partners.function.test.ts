/**
 * Stackra file contract:
 * Purpose: unit tests of `registerModelPartners` and the internal `modelOf`: a registered pair resolves, a subclass
 *          (a host override) resolves through its base, and an unregistered class is named in the error.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0305 (rule 5); ADR 0306 (overrides); ADR 0022; ADR 0269.
 */
import { HasPublicId, Model } from "@stackra/model";
import { describe, expect, it } from "@stackra/testing";

import { CrudService } from "#core/bases/crud-service.base";
import { modelOf } from "#core/functions/model-of.function";
import { registerModelPartners } from "#core/functions/register-model-partners.function";

class Order extends Model.with(HasPublicId("ord")) {}

class OrderService extends CrudService<Order> {}

class HostOrderService extends OrderService {}

class StrayService extends CrudService<Order> {}

describe(registerModelPartners, () => {
  it("registers pairs that resolve for the class and its subclasses", () => {
    registerModelPartners([[OrderService, Order]]);
    expect(modelOf(OrderService)).toBe(Order);
    expect(modelOf(HostOrderService)).toBe(Order);
  });

  it("names a class with no registered model", () => {
    expect(() => modelOf(StrayService)).toThrow(/No model is registered for StrayService/);
  });
});
