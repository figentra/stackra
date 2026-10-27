/**
 * Stackra file contract:
 * Purpose: unit and type tests of `@Str`: it records length, pattern, message and `each`, is typed against its field
 *          (tsc refuses it on a number; `each` takes a string list) and is refused outside the shape kinds.
 * Boundary: test only; imports the subject through its `#core` alias and the runner through @stackra/testing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decisions 6
 *                     and 26).
 */
import { describe, expect, it } from "@stackra/testing";

import { Schema } from "#core/bases/schema.base";
import { Str } from "#core/decorators/str.decorator";

const DATE = /^\d{4}-\d{2}-\d{2}$/;

class ContactInput extends Schema {
  @Str({
    min: 2,
    max: 120,
    message: "web::contact.errors.name",
  })
  name!: string;

  @Str({ max: 0 })
  website?: string;

  @Str({
    pattern: DATE,
    each: true,
  })
  supported = ["2026-10-01", "2027-03-01"];

  @Str()
  nickname: string | null = null;
}

describe("Str", () => {
  it("records its options per field", () => {
    const members = Str.members(ContactInput);
    expect(members.get("name")).toEqual({ min: 2, max: 120, message: "web::contact.errors.name" });
    expect(members.get("website")).toEqual({ max: 0 });
    expect(members.get("supported")).toEqual({ pattern: DATE, each: true });
    expect(members.get("nickname")).toEqual({});
  });

  it("is refused by tsc on a number, and on a string list without each", () => {
    class Wrong extends Schema {
      // @ts-expect-error -- @Str on a number field
      @Str({ max: 3 })
      count!: number;

      // @ts-expect-error -- a string list needs each: true
      @Str({ max: 10 })
      tags!: string[];
    }
    expect([...Str.members(Wrong).keys()]).toEqual(["count", "tags"]);
  });

  it("refuses a class of no shape kind when it is defined", () => {
    expect(() => {
      class Plain {
        @Str({ max: 10 })
        name = "";
      }
      return Plain;
    }).toThrow(/@str may mark .*; Plain is of no kind/);
  });
});
