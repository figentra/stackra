/**
 * Stackra file contract:
 * Purpose: unit and type tests of `CustomFieldValueSet`: a model with the `cfv` public id and the timestamps, a fresh
 *          id per row, and the types of its scope, record and values fields.
 * Boundary: test only; no database.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0116 (decision CT2); ADR 0327 (decision 3); ADR 0135.
 */
import type { PublicId } from "@stackra/contracts";
import { Model, traitsOf } from "@stackra/model";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import type { CustomFieldValue } from "#core/index";
import { CustomFieldValueSet } from "#node/models/custom-field-value-set.model";

describe("CustomFieldValueSet", () => {
  it("is a model with the cfv public id and the timestamps", () => {
    expect(new CustomFieldValueSet()).toBeInstanceOf(Model);
    expect(traitsOf(CustomFieldValueSet).map((trait) => trait.name)).toEqual([
      "has_public_id",
      "timestamps",
    ]);
    expect(traitsOf(CustomFieldValueSet)[0]?.options).toEqual({ prefix: "cfv" });
  });

  it("mints a fresh cfv id per row", () => {
    const first = new CustomFieldValueSet();
    expect(first.id).toMatch(/^cfv_[0-9a-z]{26}$/);
    expect(new CustomFieldValueSet().id).not.toBe(first.id);
  });

  it("types its scope, its record and its values", () => {
    expectTypeOf<CustomFieldValueSet["scopeId"]>().toEqualTypeOf<PublicId<"scp">>();
    expectTypeOf<CustomFieldValueSet["recordId"]>().toEqualTypeOf<string>();
    expectTypeOf<CustomFieldValueSet["values"]>().toEqualTypeOf<
      Readonly<Record<string, CustomFieldValue>>
    >();
  });
});
