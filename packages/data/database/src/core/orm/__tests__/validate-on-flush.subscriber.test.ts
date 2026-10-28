/**
 * Stackra file contract:
 * Purpose: unit tests of `ValidateOnFlushSubscriber`: a created or changed row of a `ValidateOnFlush` model is
 *          encoded through its registered schema and refused with `ModelInvalidError` on an issue; a valid row and a
 *          model without the trait pass, and an opted-in model with no schema is a setup error.
 * Boundary: test only; the ORM event arguments are stand-ins and the schema is registered by hand, as gen's
 *           `registerSchemas` would.
 * Runtime: node (vitest)
 * Governing contract: ADR 0294 (decision 26); data-layer gap mo21 (stackra-287); ADR 0022; ADR 0269.
 */
import type { EventArgs } from "@mikro-orm/core";
import { isRefusal } from "@stackra/errors";
import { HasPublicId, Model, ValidateOnFlush } from "@stackra/model";
import { describe, expect, it } from "@stackra/testing";
import { registerSchemas } from "@stackra/validation";
import { z } from "zod";

import { ModelInvalidError } from "#core/errors/model-invalid.error";
import { ValidateOnFlushSubscriber } from "#core/orm/validate-on-flush.subscriber";

class PriceRule extends Model.with(HasPublicId("prr"), ValidateOnFlush) {
  rate = 0;
}

class Orphan extends Model.with(ValidateOnFlush) {}

class Note extends Model.with(HasPublicId("not")) {
  body = "";
}

registerSchemas([[PriceRule, z.object({ rate: z.number().min(0).max(1) })]]);

/** The event arguments of a write of `entity`. */
function event(entity: object): EventArgs<object> {
  return {
    entity,
    meta: { class: entity.constructor, className: entity.constructor.name },
  } as unknown as EventArgs<object>;
}

describe("ValidateOnFlushSubscriber", () => {
  it("lets a valid row and a model without the trait pass", async () => {
    const subscriber = new ValidateOnFlushSubscriber();
    await expect(
      subscriber.beforeCreate(event(Object.assign(new PriceRule(), { rate: 0.2 }))),
    ).resolves.toBeUndefined();
    await expect(subscriber.beforeUpdate(event(new Note()))).resolves.toBeUndefined();
  });

  it("refuses a row its schema rejects, on create and on update", async () => {
    const subscriber = new ValidateOnFlushSubscriber();
    for (const hook of ["beforeCreate", "beforeUpdate"] as const) {
      const refused = await subscriber[hook](
        event(Object.assign(new PriceRule(), { rate: 2 })),
      ).then(
        () => undefined,
        (error: unknown) => error,
      );
      expect(isRefusal(refused, ModelInvalidError)).toBe(true);
      expect((refused as ModelInvalidError).model).toBe("PriceRule");
      expect((refused as ModelInvalidError).issues[0]?.startsWith("rate: ")).toBe(true);
    }
  });

  it("throws for an opted-in model with no registered schema", async () => {
    await expect(new ValidateOnFlushSubscriber().beforeCreate(event(new Orphan()))).rejects.toThrow(
      TypeError,
    );
  });
});
