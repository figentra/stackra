/**
 * Stackra file contract:
 * Purpose: proves `schemaDefaults` returns the top-level defaults an object schema declares, skips fields with none
 *          (required and optional alike), and returns nothing for a schema that is not an object.
 * Boundary: test only; plain zod schemas.
 * Runtime: node
 * Governing contract: ADR 0055; ADR 0022 (test placement).
 */
import { z } from "zod";

import { schemaDefaults } from "#form/functions/schema-defaults.function";

describe("schemaDefaults", () => {
  it("returns the declared defaults only", () => {
    const schema = z.object({
      quantity: z.number().default(1),
      notes: z.string().default(""),
      sku: z.string(),
      company: z.string().optional(),
    });
    expect(schemaDefaults(schema)).toEqual({ quantity: 1, notes: "" });
  });

  it("returns nothing for a schema that is not an object", () => {
    expect(schemaDefaults(z.string().default("x"))).toEqual({});
  });
});
