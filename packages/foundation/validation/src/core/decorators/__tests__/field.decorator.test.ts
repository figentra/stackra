/**
 * Stackra file contract:
 * Purpose: unit and type tests of `@Field(zod)`: it records the schema; tsc refuses a schema whose output the field
 *          cannot hold and accepts a narrower output (`z.literal(true)` on a `boolean`, an optional schema on `?:`).
 * Boundary: test only; imports the subject through its `#core` alias and the runner through @stackra/testing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decisions 6
 *                     and 26).
 */
import { describe, expect, it } from "@stackra/testing";
import { z } from "zod";

import { Schema } from "#core/bases/schema.base";
import { Field } from "#core/decorators/field.decorator";

const EMAIL = z.string().trim().email("web::contact.errors.email").max(254);
const CONSENT = z.literal(true, { error: "web::contact.errors.consent" });
const PLAN = z.string().trim().max(64).optional().catch(undefined);
const DATA = z.record(z.string(), z.union([z.string(), z.number()]));

class ContactInput extends Schema {
  // reason: test of the hatch with its own message
  @Field(EMAIL)
  email!: string;

  // reason: only `true` passes, the field stays boolean
  @Field(CONSENT)
  consent!: boolean;

  // reason: a bad value falls back to absent
  @Field(PLAN)
  plan?: string;

  // reason: a union of value types
  @Field(DATA)
  data!: Record<string, string | number>;
}

describe("Field", () => {
  it("records the schema of each field", () => {
    const members = Field.members(ContactInput);
    expect(members.get("email")).toBe(EMAIL);
    expect(members.get("consent")).toBe(CONSENT);
    expect(members.get("plan")).toBe(PLAN);
    expect(members.get("data")).toBe(DATA);
  });

  it("is refused by tsc when the schema's output does not fit the field", () => {
    class Wrong extends Schema {
      // @ts-expect-error -- the schema yields string, the field is number
      @Field(z.string())
      amount!: number;

      // @ts-expect-error -- the schema may yield undefined, the field is required
      @Field(z.string().optional())
      name!: string;
    }
    expect(Field.members(Wrong).size).toBe(2);
  });

  it("refuses a class of no shape kind when it is defined", () => {
    expect(() => {
      class Plain {
        // reason: test
        @Field(z.string())
        name = "";
      }
      return Plain;
    }).toThrow(/@field may mark .*; Plain is of no kind/);
  });
});
