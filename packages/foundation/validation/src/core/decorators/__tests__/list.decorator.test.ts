/**
 * Stackra file contract:
 * Purpose: unit and type tests of `@List`: it records item-count bounds and uniqueness, is typed against its field
 *          (tsc refuses it on a field that is not an array) and is refused outside the shape kinds.
 * Boundary: test only; imports the subject through its `#core` alias and the runner through @stackra/testing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decisions 6
 *                     and 26).
 */
import { describe, expect, it } from "@stackra/testing";

import { Schema } from "#core/bases/schema.base";
import { List } from "#core/decorators/list.decorator";

class Line extends Schema {
  quantity = 1;
}

class CreateOrderInput extends Schema {
  @List({
    min: 1,
    max: 100,
  })
  lines!: Line[];

  @List({ unique: true })
  tags: readonly string[] = [];

  @List
  notes?: string[];
}

describe("List", () => {
  it("records its options per field", () => {
    const members = List.members(CreateOrderInput);
    expect(members.get("lines")).toEqual({ min: 1, max: 100 });
    expect(members.get("tags")).toEqual({ unique: true });
    expect(members.get("notes")).toEqual({});
  });

  it("is refused by tsc on a field that is not an array", () => {
    class Wrong extends Schema {
      // @ts-expect-error -- @List on a string field
      @List({ min: 1 })
      tags!: string;
    }
    expect(List.members(Wrong).get("tags")).toEqual({ min: 1 });
  });

  it("refuses a class of no shape kind when it is defined", () => {
    expect(() => {
      class Plain {
        @List({ min: 1 })
        items: string[] = [];
      }
      return Plain;
    }).toThrow(/@list may mark .*; Plain is of no kind/);
  });
});
