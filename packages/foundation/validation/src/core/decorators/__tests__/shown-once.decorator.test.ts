/**
 * Stackra file contract:
 * Purpose: unit tests of `@ShownOnce`: written bare, it records `true` on a field of any type, ancestors included, and
 *          is refused outside the shape kinds.
 * Boundary: test only; imports the subject through its `#core` alias and the runner through @stackra/testing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (R6).
 */
import { describe, expect, it } from "@stackra/testing";

import { Schema } from "#core/bases/schema.base";
import { ShownOnce } from "#core/decorators/shown-once.decorator";

class RegisterEndpointOutput extends Schema {
  @ShownOnce
  signingSecret!: string;

  endpointId!: string;
}

class RotateEndpointOutput extends RegisterEndpointOutput {
  @ShownOnce
  previousSecret: string | null = null;
}

describe("ShownOnce", () => {
  it("records true on each shown-once field, ancestors included", () => {
    expect([...ShownOnce.members(RegisterEndpointOutput)]).toEqual([["signingSecret", true]]);
    expect(new Set(ShownOnce.members(RotateEndpointOutput).keys())).toEqual(
      new Set(["signingSecret", "previousSecret"]),
    );
  });

  it("refuses a class of no shape kind when it is defined", () => {
    expect(() => {
      class Plain {
        @ShownOnce
        secret = "";
      }
      return Plain;
    }).toThrow(/@shown-once may mark .*; Plain is of no kind/);
  });
});
