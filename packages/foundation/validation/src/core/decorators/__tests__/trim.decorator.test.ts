/**
 * Stackra file contract:
 * Purpose: unit and type tests of `@Trim`: written bare, it records `true` on a string field, is refused by tsc on a
 *          number and is refused outside the shape kinds.
 * Boundary: test only; imports the subject through its `#core` alias and the runner through @stackra/testing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decision 6).
 */
import { describe, expect, it } from "@stackra/testing";

import { Schema } from "#core/bases/schema.base";
import { Str } from "#core/decorators/str.decorator";
import { Trim } from "#core/decorators/trim.decorator";

class ContactInput extends Schema {
  @Trim
  @Str({ min: 2 })
  name!: string;

  @Trim
  company?: string;

  message = "";
}

describe("Trim", () => {
  it("records true on each trimmed field, beside the field's other rules", () => {
    expect([...Trim.members(ContactInput)]).toEqual([
      ["name", true],
      ["company", true],
    ]);
    expect(Str.members(ContactInput).get("name")).toEqual({ min: 2 });
  });

  it("is refused by tsc on a number", () => {
    class Wrong extends Schema {
      // @ts-expect-error -- @Trim on a number field
      @Trim
      count = 0;
    }
    expect(Trim.members(Wrong).get("count")).toBe(true);
  });

  it("refuses a class of no shape kind when it is defined", () => {
    expect(() => {
      class Plain {
        @Trim
        name = "";
      }
      return Plain;
    }).toThrow(/@trim may mark .*; Plain is of no kind/);
  });
});
