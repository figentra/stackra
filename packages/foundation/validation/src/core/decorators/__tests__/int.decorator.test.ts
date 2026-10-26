/**
 * Stackra file contract:
 * Purpose: unit and type tests of `@Int`: typed against its field (tsc refuses it on a string, `each` takes a number
 *          list or map), metadata-only under `useDefineForClassFields`, and refused outside the shape kinds.
 * Boundary: test only; imports the subject through its `#core` alias and the runner through @stackra/testing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decisions 4, 6
 *                     and 26).
 */
import { describe, expect, it } from "@stackra/testing";

import { Schema } from "#core/bases/schema.base";
import { Int } from "#core/decorators/int.decorator";

class Quantities extends Schema {
  @Int({
    min: 1,
    max: 99,
    message: "orders::errors.quantity",
  })
  quantity = 1;

  @Int()
  optional?: number;

  @Int({ min: 0 })
  nullable: number | null = null;

  @Int({
    min: 1,
    each: true,
  })
  perLine: number[] = [];

  @Int({ each: true })
  perCode: Record<string, number> = {};

  @Int({ min: 1 })
  pageSize: 20 | 50 = 20;
}

describe("Int", () => {
  it("records its options per field, and {} when called bare", () => {
    const members = Int.members(Quantities);
    expect(members.get("quantity")).toEqual({
      min: 1,
      max: 99,
      message: "orders::errors.quantity",
    });
    expect(members.get("optional")).toEqual({});
    expect(members.get("perLine")).toEqual({ min: 1, each: true });
    expect([...members.keys()]).toEqual([
      "quantity",
      "optional",
      "nullable",
      "perLine",
      "perCode",
      "pageSize",
    ]);
  });

  it("installs no accessor, so the instance keeps its own field values", () => {
    const value = new Quantities();
    expect(Object.getOwnPropertyDescriptor(Quantities.prototype, "quantity")).toBeUndefined();
    expect(Object.getOwnPropertyDescriptor(value, "quantity")).toMatchObject({
      value: 1,
      writable: true,
    });
    value.quantity = 5;
    expect(value.quantity).toBe(5);
  });

  it("is refused by tsc on a string, and on a number list without each", () => {
    class Wrong extends Schema {
      // @ts-expect-error -- @Int on a string field
      @Int()
      code!: string;

      // @ts-expect-error -- a number list needs each: true
      @Int({ min: 1 })
      list!: number[];

      // @ts-expect-error -- each: true on a single number
      @Int({ each: true })
      single!: number;
    }
    expect(Int.members(Wrong).size).toBe(3);
  });

  it("refuses a class of no shape kind when it is defined", () => {
    expect(() => {
      class Plain {
        @Int()
        count = 0;
      }
      return Plain;
    }).toThrow(/@int may mark .*schema.*; Plain is of no kind/);
  });
});
