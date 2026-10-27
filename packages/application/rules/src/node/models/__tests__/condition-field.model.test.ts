/**
 * Stackra file contract:
 * Purpose: unit and type tests of `ConditionField`: a model with the `rcf` public id and the timestamps, a fresh id per
 *          row, no values unless an enum sets them, and the types of its fields.
 * Boundary: test only; no database.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0331 (decision 4); ADR 0135; STA-1250.
 */
import type { PublicId } from "@stackra/contracts";
import type { I18nKey } from "@stackra/i18n";
import { Model, traitsOf } from "@stackra/model";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import type { FieldType } from "#contracts/index";
import { ConditionField } from "#node/models/condition-field.model";

describe("ConditionField", () => {
  it("is a model with the rcf public id and the timestamps", () => {
    expect(new ConditionField()).toBeInstanceOf(Model);
    expect(traitsOf(ConditionField).map((trait) => trait.name)).toEqual([
      "has_public_id",
      "timestamps",
    ]);
    expect(traitsOf(ConditionField)[0]?.options).toEqual({ prefix: "rcf" });
  });

  it("mints a fresh rcf id per row and holds no values by default", () => {
    const first = new ConditionField();
    expect(first.id).toMatch(/^rcf_[0-9a-z]{26}$/);
    expect(new ConditionField().id).not.toBe(first.id);
    expect(first.values).toBeNull();
  });

  it("types its fields", () => {
    expectTypeOf<ConditionField["id"]>().toEqualTypeOf<PublicId<"rcf">>();
    expectTypeOf<ConditionField["type"]>().toEqualTypeOf<FieldType>();
    expectTypeOf<ConditionField["label"]>().toEqualTypeOf<I18nKey>();
    expectTypeOf<ConditionField["values"]>().toEqualTypeOf<Readonly<
      Record<string, I18nKey>
    > | null>();
  });
});
