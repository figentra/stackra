/**
 * Stackra file contract:
 * Purpose: unit and type tests of `validate(Class, input)`: success returns an instance with defaults applied, failure
 *          returns the issues with the shape's message keys and never throws, and a class with no registered schema
 *          fails clearly.
 * Boundary: test only; registers test schemas the way a generated schemas file does.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decision 26);
 *                     registry v3.1 gap G1.
 */
import assert from "node:assert/strict";

import { describe, expect, expectTypeOf, it } from "@stackra/testing";
import { z } from "zod";

import { Schema } from "#core/bases/schema.base";
import { Int } from "#core/decorators/int.decorator";
import { Str } from "#core/decorators/str.decorator";
import { registerSchemas } from "#core/functions/register-schemas.function";
import { validate } from "#core/functions/validate.function";

class ContactInput extends Schema {
  @Str({ min: 2, message: "web::contact.errors.name" })
  name!: string;

  @Int({ min: 0 })
  seats = 1;
}

class Unregistered extends Schema {}

registerSchemas([
  [
    ContactInput,
    z.object({
      name: z.string().trim().min(2, "web::contact.errors.name"),
      seats: z.number().int().min(0).default(1),
    }),
  ],
]);

describe("validate", () => {
  it("returns an instance of the class with defaults applied", () => {
    const result = validate(ContactInput, { name: "  Lina " });
    assert(result.success, "the input is valid");
    expect(result.data).toBeInstanceOf(ContactInput);
    expect(result.data).toEqual({ name: "Lina", seats: 1 });
    expectTypeOf(result.data).toEqualTypeOf<ContactInput>();
  });

  it("returns the issues with the shape's message keys, without throwing", () => {
    const result = validate(ContactInput, { name: "L", seats: -1 });
    assert(!result.success, "the input is invalid");
    expect(result.error.issues.map((issue) => issue.path.join("."))).toEqual(["name", "seats"]);
    expect(result.error.issues[0]?.message).toBe("web::contact.errors.name");
  });

  it("refuses input that is not an object", () => {
    expect(validate(ContactInput, "Lina").success).toBe(false);
    expect(validate(ContactInput, null).success).toBe(false);
  });

  it("fails clearly for a class with no registered schema", () => {
    expect(() => validate(Unregistered, {})).toThrow(
      /Unregistered has no registered schema: run `stackra gen`/,
    );
  });
});
