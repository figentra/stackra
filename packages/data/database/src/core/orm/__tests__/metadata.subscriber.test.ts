/**
 * Stackra file contract:
 * Purpose: unit tests of `MetadataSubscriber`: a created or changed row of a `HasMetadata` model with metadata that
 *          is not a bounded string bag is refused with `MetadataInvalidError`; any other model's row passes.
 * Boundary: test only; the ORM event arguments are stand-ins.
 * Runtime: node (vitest)
 * Governing contract: ADR 0321 (decision 4); ADR 0096 (decision 4); ADR 0022; ADR 0269.
 */
import type { EventArgs } from "@mikro-orm/core";
import { isRefusal } from "@stackra/errors";
import { HasPublicId, Model } from "@stackra/model";
import { describe, expect, it } from "@stackra/testing";

import { MetadataInvalidError } from "#core/errors/metadata-invalid.error";
import { MetadataSubscriber } from "#core/orm/metadata.subscriber";
import { HasMetadata } from "#core/traits/has-metadata.trait";

class Customer extends Model.with(HasPublicId("cus"), HasMetadata) {}

class Note extends Model.with(HasPublicId("not")) {
  metadata: unknown = 3;
}

/** The event arguments of a write of `entity`. */
function event(entity: object): EventArgs<object> {
  return {
    entity,
    meta: { class: entity.constructor, className: entity.constructor.name },
  } as unknown as EventArgs<object>;
}

describe("MetadataSubscriber", () => {
  it("refuses bad metadata on create and update, and passes a good bag", () => {
    const subscriber = new MetadataSubscriber();
    const bad = Object.assign(new Customer(), { metadata: { count: 3 } });
    for (const hook of ["beforeCreate", "beforeUpdate"] as const) {
      let refused: unknown;
      try {
        subscriber[hook](event(bad));
      } catch (error) {
        refused = error;
      }
      expect(isRefusal(refused, MetadataInvalidError)).toBe(true);
      expect(() => subscriber[hook](event(new Customer()))).not.toThrow();
    }
  });

  it("leaves a model without the trait alone", () => {
    expect(() => new MetadataSubscriber().beforeUpdate(event(new Note()))).not.toThrow();
  });
});
