/**
 * Stackra file contract:
 * Purpose: unit tests of `systemFieldsOf` and `SYSTEM_FIELDS`: a model's system fields come from its traits only, a
 *          model without them has none, a subclass inherits them, and the list is frozen.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: data-layer gap mo21 (stackra-287); ADR 0022; ADR 0269.
 */
import { describe, expect, it } from "@stackra/testing";

import { Model } from "#core/bases/model.base";
import { SYSTEM_FIELDS } from "#core/constants/system-fields.constant";
import { systemFieldsOf } from "#core/functions/system-fields-of.function";
import { Archivable } from "#core/traits/archivable.trait";
import { HasPublicId } from "#core/traits/has-public-id.trait";
import { SoftDeletes } from "#core/traits/soft-deletes.trait";
import { Timestamps } from "#core/traits/timestamps.trait";
import { UserStamps } from "#core/traits/user-stamps.trait";
import { ValidateOnFlush } from "#core/traits/validate-on-flush.trait";
import { Versioned } from "#core/traits/versioned.trait";

class Order extends Model.with(HasPublicId("ord"), Timestamps, UserStamps, Versioned) {}

class Note extends Model.with(SoftDeletes, Archivable, ValidateOnFlush) {}

class Catalogue extends Model {
  version = 3;
}

class RushOrder extends Order {}

describe(systemFieldsOf, () => {
  it("lists the fields of the model's traits", () => {
    expect(systemFieldsOf(Order)).toEqual([
      "id",
      "createdAt",
      "updatedAt",
      "createdBy",
      "updatedBy",
      "version",
    ]);
    expect(systemFieldsOf(Note)).toEqual(["deletedAt", "archivedAt"]);
    expect(systemFieldsOf(RushOrder)).toEqual(systemFieldsOf(Order));
  });

  it("leaves a model's own field of the same name alone", () => {
    expect(systemFieldsOf(Catalogue)).toEqual([]);
  });

  it("keeps the list frozen", () => {
    expect(Object.isFrozen(SYSTEM_FIELDS)).toBe(true);
    expect(Object.isFrozen(SYSTEM_FIELDS.timestamps)).toBe(true);
  });
});
