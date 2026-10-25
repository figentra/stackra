/**
 * Stackra file contract:
 * Purpose: unit and type tests of `CustomField`: a model with the `cfd` public id, the timestamps and a translatable
 *          label, its defaults (not required, no rules) and the types of its scope, key and definition fields.
 * Boundary: test only; no database.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0116 (decision CT2); ADR 0327 (decision 3); ADR 0135.
 */
import type { PublicId } from "@stackra/contracts";
import { Model, traitsOf, type Translated } from "@stackra/model";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import type { CustomFieldType } from "#core/index";
import { CustomField } from "#node/models/custom-field.model";

describe("CustomField", () => {
  it("is a model with the cfd public id, the timestamps and a translatable label", () => {
    expect(new CustomField()).toBeInstanceOf(Model);
    const traits = traitsOf(CustomField);
    expect(traits.map((trait) => trait.name)).toEqual([
      "has_public_id",
      "timestamps",
      "translatable",
    ]);
    expect(traits[0]?.options).toEqual({ prefix: "cfd" });
    expect(traits[2]?.options).toEqual({ fields: ["label"] });
  });

  it("mints a cfd id and defaults to an optional field with no rules", () => {
    const row = new CustomField();
    expect(row.id).toMatch(/^cfd_[0-9a-z]{26}$/);
    expect(row.required).toBe(false);
    expect(row.rules).toEqual({});
    expectTypeOf(row.id).toEqualTypeOf<PublicId<"cfd">>();
  });

  it("types its scope, its keys and its definition fields", () => {
    expectTypeOf<CustomField["scopeId"]>().toEqualTypeOf<PublicId<"scp">>();
    expectTypeOf<CustomField["model"]>().toEqualTypeOf<string>();
    expectTypeOf<CustomField["type"]>().toEqualTypeOf<CustomFieldType>();
    expectTypeOf<CustomField["label"]>().toEqualTypeOf<Translated>();
  });
});
