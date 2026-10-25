/**
 * Stackra file contract:
 * Purpose: unit and type tests of `CursorInput`: a limit from 1 to 100, 20 by default, an optional cursor that may be
 *          absent but not `undefined`, its schema registered on load, and its fields equal to that schema's output.
 * Boundary: test only; validates through the schema this package ships.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decision 26); the
 *                     HTTP conventions (cursor pagination).
 */
import { kindOf } from "@stackra/container";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";
import type { z } from "zod";

import { CURSOR_INPUT_SCHEMA } from "#core/constants/cursor-input-schema.constant";
import { Int } from "#core/decorators/int.decorator";
import { validate } from "#core/functions/validate.function";
import { CursorInput } from "#core/schemas/cursor-input.schema";
import type { Fields } from "#core/types/fields.type";
import type { Same } from "#core/types/same.type";

describe("CursorInput", () => {
  it("defaults the limit to 20 and leaves the cursor absent", () => {
    const parsed = validate(CursorInput, {});
    expect(parsed.success && parsed.data).toEqual({ limit: 20 });
    expect(parsed.success && "cursor" in parsed.data).toBe(false);
  });

  it.each([1, 20, 100])("accepts a limit of %i", (limit) => {
    expect(validate(CursorInput, { limit, cursor: "c_2" }).success).toBe(true);
  });

  it.each([0, 101, 2.5, "20"])("refuses a limit of %j", (limit) => {
    expect(validate(CursorInput, { limit }).success).toBe(false);
  });

  it("refuses a cursor given as undefined", () => {
    expect(validate(CursorInput, { cursor: undefined }).success).toBe(false);
  });

  it("is a schema whose limit carries @Int, and whose fields equal its schema's output", () => {
    expect(kindOf(CursorInput)?.kind).toBe("schema");
    expect(Int.members(CursorInput).get("limit")).toEqual({ min: 1, max: 100 });
    expectTypeOf<
      Same<z.output<typeof CURSOR_INPUT_SCHEMA>, Fields<CursorInput>>
    >().toEqualTypeOf<true>();
  });
});
