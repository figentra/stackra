/**
 * Stackra file contract:
 * Purpose: unit tests of `registerSchemas`: it links each class to its schema, a second registration replaces the
 *          first, and a subclass is not linked by its parent's registration.
 * Boundary: test only; reads back through `schemaOf`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); registry v3.1 gap G1.
 */
import { describe, expect, it } from "@stackra/testing";
import { z } from "zod";

import { Schema } from "#core/bases/schema.base";
import { registerSchemas } from "#core/functions/register-schemas.function";
import { schemaOf } from "#core/functions/schema-of.function";

class RequestedLine extends Schema {
  quantity = 1;
}

class PricedLine extends RequestedLine {
  unitPriceMinor = 0;
}

const REQUESTED_LINE = z.object({ quantity: z.number().int().min(1) });
const PRICED_LINE = REQUESTED_LINE.extend({ unitPriceMinor: z.number().int() });

describe("registerSchemas", () => {
  it("links each class of the pairs to its schema", () => {
    registerSchemas([
      [RequestedLine, REQUESTED_LINE],
      [PricedLine, PRICED_LINE],
    ]);
    expect(schemaOf(RequestedLine)).toBe(REQUESTED_LINE);
    expect(schemaOf(PricedLine)).toBe(PRICED_LINE);
  });

  it("replaces a class's schema when it is registered again", () => {
    const reloaded = z.object({ quantity: z.number().int().min(1).max(99) });
    registerSchemas([[RequestedLine, reloaded]]);
    expect(schemaOf(RequestedLine)).toBe(reloaded);
  });

  it("does not link a subclass through its parent", () => {
    class DiscountedLine extends RequestedLine {
      discountMinor = 0;
    }
    registerSchemas([[RequestedLine, REQUESTED_LINE]]);
    expect(() => schemaOf(DiscountedLine)).toThrow(/DiscountedLine has no registered schema/);
  });
});
