/**
 * Stackra file contract:
 * Purpose: unit tests of `schemaOf`: it returns the registered schema and throws a `TypeError` that names the class and
 *          the fix when none is registered.
 * Boundary: test only; registers a test schema the way a generated schemas file does.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); registry v3.1 gap G1.
 */
import { describe, expect, it } from "@stackra/testing";
import { z } from "zod";

import { Schema } from "#core/bases/schema.base";
import { registerSchemas } from "#core/functions/register-schemas.function";
import { schemaOf } from "#core/functions/schema-of.function";

class OrderView extends Schema {
  total = 0;
}

const ORDER_VIEW = z.object({ total: z.number().int() });
registerSchemas([[OrderView, ORDER_VIEW]]);

describe("schemaOf", () => {
  it("returns the registered schema", () => {
    expect(schemaOf(OrderView)).toBe(ORDER_VIEW);
  });

  it("throws a TypeError naming the class and the fix when none is registered", () => {
    class Missing extends Schema {}
    expect(() => schemaOf(Missing)).toThrow(TypeError);
    expect(() => schemaOf(Missing)).toThrow(
      /Missing has no registered schema: run `stackra gen` .* registerSchemas\(\[\[Missing, schema\]\]\)/,
    );
  });
});
