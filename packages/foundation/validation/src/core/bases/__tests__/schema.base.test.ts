/**
 * Stackra file contract:
 * Purpose: unit and type tests of `Schema`: it is the `schema` kind, `X.create` builds an instance through the
 *          registered schema (defaults applied, rules checked, a code-form `Date` accepted) and fails clearly with no
 *          schema, and its brand stays out of `Fields`.
 * Boundary: test only; registers test schemas the way a generated schemas file does.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decisions 16, 25
 *                     and 26).
 */
import { kindOf } from "@stackra/container";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";
import { z, ZodError } from "zod";

import { Schema } from "#core/bases/schema.base";
import { Int } from "#core/decorators/int.decorator";
import { isoDateTime } from "#core/functions/iso-date-time.function";
import { registerSchemas } from "#core/functions/register-schemas.function";
import type { Fields } from "#core/types/fields.type";

class PointsEarned extends Schema {
  memberId!: string;

  @Int({ min: 1 })
  points!: number;

  @Int({ min: 0 })
  bonus = 0;

  at!: Date;
}

class Unregistered extends Schema {
  name!: string;
}

registerSchemas([
  [
    PointsEarned,
    z.object({
      memberId: z.string(),
      points: z.number().int().min(1),
      bonus: z.number().int().min(0).default(0),
      at: isoDateTime(),
    }),
  ],
]);

const AT = new Date("2026-10-24T07:00:00.000Z");

describe("Schema", () => {
  it("is the schema kind, inherited by every shape class", () => {
    expect(kindOf(Schema)).toEqual({ kind: "schema", options: {} });
    expect(kindOf(PointsEarned)?.kind).toBe("schema");
  });

  it("creates an instance of the calling class through its registered schema", () => {
    const event = PointsEarned.create({ memberId: "usr_1", points: 10, bonus: 0, at: AT });
    expect(event).toBeInstanceOf(PointsEarned);
    expect(event).toEqual({ memberId: "usr_1", points: 10, bonus: 0, at: AT });
    expectTypeOf(event).toEqualTypeOf<PointsEarned>();
  });

  it("applies the schema's defaults", () => {
    const values = { memberId: "usr_1", points: 10, at: AT } as Fields<PointsEarned>;
    expect(PointsEarned.create(values).bonus).toBe(0);
  });

  it("throws the schema's ZodError for values that break a rule", () => {
    expect(() => PointsEarned.create({ memberId: "usr_1", points: 0, bonus: 0, at: AT })).toThrow(
      ZodError,
    );
  });

  it("fails clearly for a class with no registered schema", () => {
    expect(() => Unregistered.create({ name: "x" })).toThrow(
      /Unregistered has no registered schema/,
    );
  });

  it("keeps its brand out of the data fields", () => {
    expectTypeOf<Fields<PointsEarned>>().toEqualTypeOf<{
      memberId: string;
      points: number;
      bonus: number;
      at: Date;
    }>();
    // @ts-expect-error -- a shape class is abstract at its base
    expect(() => new Schema()).not.toThrow();
  });
});
