/**
 * Stackra file contract:
 * Purpose: unit tests of `@Hidden`: written bare, it records `true` on a field of any type and is refused outside the
 *          shape kinds.
 * Boundary: test only; imports the subject through its `#core` alias and the runner through @stackra/testing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (R6).
 */
import { describe, expect, it } from "@stackra/testing";

import { Schema } from "#core/bases/schema.base";
import { Hidden } from "#core/decorators/hidden.decorator";

class ApiKeyRecord extends Schema {
  @Hidden
  tokenHash!: string;

  @Hidden
  attempts = 0;

  label = "";
}

describe("Hidden", () => {
  it("records true on each hidden field, whatever its type", () => {
    expect([...Hidden.members(ApiKeyRecord)]).toEqual([
      ["tokenHash", true],
      ["attempts", true],
    ]);
  });

  it("refuses a class of no shape kind when it is defined", () => {
    expect(() => {
      class Plain {
        @Hidden
        secret = "";
      }
      return Plain;
    }).toThrow(/@hidden may mark .*; Plain is of no kind/);
  });
});
