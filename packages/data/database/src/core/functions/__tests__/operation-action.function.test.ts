/**
 * Stackra file contract:
 * Purpose: unit tests of `operationAction`: the generated action is an `action` kind keyed `<model>.<operation>` with
 *          its permission and entitlements recorded, `create` calls the service's `create`, `update` changes the row
 *          with the input's `<model>Id` and only the fields given, and another operation is refused.
 * Boundary: test only; the service is a recording stand-in.
 * Runtime: node (vitest)
 * Governing contract: ADR 0105 as amended by ADR 0294; ADR 0098; ADR 0022; ADR 0269.
 */
import { kindOf } from "@stackra/container";
import { HasPublicId, Model } from "@stackra/model";
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { CrudService } from "#core/bases/crud-service.base";
import { operationAction } from "#core/functions/operation-action.function";

class ProductCollection extends Model.with(HasPublicId("pcl")) {
  slug = "";
}

class ProductCollectionService extends CrudService<ProductCollection> {}

class ProductLimitEntitlement {}

/** Builds a generated action over a recording service. */
function build(operation: "create" | "update") {
  const service = Object.assign(
    Object.create(ProductCollectionService.prototype) as ProductCollectionService,
    {
      create: vi.fn((data: object) => Object.assign(new ProductCollection(), data)),
      update: vi.fn(async (_where: object, data: object) =>
        Object.assign(new ProductCollection(), data),
      ),
    },
  );
  const type = operationAction(ProductCollection, operation, {
    service: ProductCollectionService,
    permission: "catalogue.product_collection.create",
    entitlements: [ProductLimitEntitlement],
  });
  const action = Reflect.construct(type, [service]) as { handle(input: object): Promise<unknown> };
  return { type, service, action };
}

describe(operationAction, () => {
  it("writes the create action over the service", async () => {
    const { type, service, action } = build("create");
    expect(type.name).toBe("ProductCollectionCreateAction");
    expect(kindOf(type)).toMatchObject({
      kind: "action",
      options: { key: "product_collection.create", entitlements: [ProductLimitEntitlement] },
    });
    expect(await action.handle({ slug: "summer" })).toMatchObject({ slug: "summer" });
    expect(service.create).toHaveBeenCalledWith({ slug: "summer" });
  });

  it("writes the update action by the input's model id", async () => {
    const { service, action } = build("update");
    await action.handle({ productCollectionId: "pcl_1", slug: "winter" });
    expect(service.update).toHaveBeenCalledWith({ id: "pcl_1" }, { slug: "winter" });
  });

  it("refuses another operation", () => {
    expect(() =>
      operationAction(ProductCollection, "delete" as "create", {
        service: ProductCollectionService,
        permission: "x",
      }),
    ).toThrow(/create and update/);
  });
});
