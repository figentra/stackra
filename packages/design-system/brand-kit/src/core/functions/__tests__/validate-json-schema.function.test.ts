/**
 * Stackra file contract:
 * Purpose: unit tests of `validateJsonSchema`: a conforming value has no problems; types (null and integer included),
 *          patterns, bounds, required and unknown fields, item checks and local refs each report with their path.
 * Boundary: test only; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0441 (decision 5).
 */
import { describe, expect, it } from "@stackra/testing";

import { validateJsonSchema } from "#core/functions/validate-json-schema.function";

const SCHEMA = {
  type: "object",
  required: ["a"],
  additionalProperties: false,
  properties: {
    a: { $ref: "#/$defs/h" },
    b: { type: "array", items: { type: "integer", minimum: 100 } },
  },
  $defs: { h: { type: ["string", "null"], pattern: "^x" } },
};

describe("validateJsonSchema", () => {
  it("passes a conforming value", () => {
    expect(validateJsonSchema(SCHEMA, { a: "xy", b: [100] })).toEqual([]);
    expect(validateJsonSchema(SCHEMA, { a: null })).toEqual([]);
  });

  it("reports a pattern, a bound and an unknown field with their paths", () => {
    expect(validateJsonSchema(SCHEMA, { a: "y", b: [50], c: 1 })).toEqual([
      '$.a: "y" does not match ^x',
      "$.b[0]: below 100",
      '$: unknown field "c"',
    ]);
  });

  it("reports a missing required field and a wrong type", () => {
    expect(validateJsonSchema(SCHEMA, {})).toEqual(['$: "a" is required']);
    expect(validateJsonSchema(SCHEMA, { a: 1 })).toEqual([
      "$.a: expected string or null, got integer",
    ]);
  });

  it("reads an integer as a number", () => {
    expect(validateJsonSchema({ type: "number", maximum: 1 }, 1)).toEqual([]);
  });
});
