/**
 * Stackra file contract:
 * Purpose: unit and type tests of `@Lowercase`: written bare, it records `true` on a string field, is refused by tsc
 *          on a number and is refused outside the shape kinds.
 * Boundary: test only; imports the subject through its `#core` alias and the runner through @stackra/testing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decision 6).
 */
import { describe, expect, it } from "@stackra/testing";

import { Schema } from "#core/bases/schema.base";
import { Lowercase } from "#core/decorators/lowercase.decorator";

class SignUpInput extends Schema {
  @Lowercase
  email!: string;

  name = "";
}

describe("Lowercase", () => {
  it("records true on each lowercased field", () => {
    expect([...Lowercase.members(SignUpInput)]).toEqual([["email", true]]);
  });

  it("is refused by tsc on a number", () => {
    class Wrong extends Schema {
      // @ts-expect-error -- @Lowercase on a number field
      @Lowercase
      count = 0;
    }
    expect(Lowercase.members(Wrong).get("count")).toBe(true);
  });

  it("refuses a class of no shape kind when it is defined", () => {
    expect(() => {
      class Plain {
        @Lowercase
        email = "";
      }
      return Plain;
    }).toThrow(/@lowercase may mark .*; Plain is of no kind/);
  });
});
