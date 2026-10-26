/**
 * Stackra file contract:
 * Purpose: unit and type tests of `TableInput`: a limit of 20, 50 or 100 (20 by default), an optional sort with an
 *          `asc` or `desc` direction, a filter that defaults to `{}`, its schema registered on load, and its fields
 *          equal to that schema's output.
 * Boundary: test only; validates through the unnarrowed schema this package ships.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0294 (decision 26);
 *                     ADR 0307 (resource tables).
 */
import { describe, expect, expectTypeOf, it } from "@stackra/testing";
import type { z } from "zod";

import type { TABLE_INPUT_SCHEMA } from "#core/constants/table-input-schema.constant";
import { validate } from "#core/functions/validate.function";
import { TableInput } from "#core/schemas/table-input.schema";
import type { Fields } from "#core/types/fields.type";
import type { Same } from "#core/types/same.type";

class ListOrdersInput extends TableInput {}

describe("TableInput", () => {
  it("defaults the limit and the filter", () => {
    const parsed = validate(TableInput, {});
    expect(parsed.success && parsed.data).toEqual({ limit: 20, filter: {} });
  });

  it("accepts a page size, a sort and filters", () => {
    const input = {
      cursor: "c_9",
      limit: 50,
      sort: { key: "createdAt", direction: "desc" },
      filter: { status: ["paid"] },
    };
    const parsed = validate(TableInput, input);
    expect(parsed.success && parsed.data).toEqual(input);
  });

  it.each([10, 25, 200, "50"])("refuses a limit of %j", (limit) => {
    expect(validate(TableInput, { limit }).success).toBe(false);
  });

  it("refuses a sort direction other than asc or desc", () => {
    expect(validate(TableInput, { sort: { key: "createdAt", direction: "up" } }).success).toBe(
      false,
    );
  });

  it("leaves a subclass to its own generated schema", () => {
    expect(() => validate(ListOrdersInput, {})).toThrow(/ListOrdersInput has no registered schema/);
  });

  it("has fields equal to its schema's output", () => {
    expectTypeOf<
      Same<z.output<typeof TABLE_INPUT_SCHEMA>, Fields<TableInput>>
    >().toEqualTypeOf<true>();
  });
});
