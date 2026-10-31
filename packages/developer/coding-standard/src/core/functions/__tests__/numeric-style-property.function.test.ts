/**
 * Stackra file contract:
 * Purpose: unit tests of `numericStyleProperty`: a matching key with a non-zero number, zero and negatives only with
 *          `anyNumber`, and keys or values that do not count.
 * Boundary: test only; builds minimal nodes by hand, imports the subject through its `#core` alias and the runner
 *           through @stackra/testing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing).
 */
import { describe, expect, it } from "@stackra/testing";

import { numericStyleProperty } from "#core/functions/numeric-style-property.function";
import type { AstNode } from "#core/types/ast-node.type";

const at = { start: { line: 1, column: 0 }, end: { line: 1, column: 0 } };
const node = (fields: Omit<AstNode, "range" | "loc">): AstNode => ({
  range: [0, 0],
  loc: at,
  ...fields,
});
const property = (key: string, value: AstNode): AstNode =>
  node({ type: "Property", key: node({ type: "Identifier", name: key }), value });
const number = (value: number) => node({ type: "Literal", value });
const negative = (value: number) => node({ type: "UnaryExpression", argument: number(value) });
const isZ = (key: string) => key === "zIndex";

describe("numericStyleProperty", () => {
  it("returns the key and number of a matching property", () => {
    expect(numericStyleProperty(property("zIndex", number(10)), isZ)).toEqual({
      key: "zIndex",
      value: 10,
    });
  });

  it("skips zero and negatives unless anyNumber", () => {
    expect(numericStyleProperty(property("zIndex", number(0)), isZ)).toBeUndefined();
    expect(numericStyleProperty(property("zIndex", negative(1)), isZ)).toBeUndefined();
    expect(numericStyleProperty(property("zIndex", number(0)), isZ, true)?.value).toBe(0);
    expect(numericStyleProperty(property("zIndex", negative(4)), isZ, true)?.value).toBe(4);
  });

  it("skips another key, a string key's mismatch and a non-number value", () => {
    expect(numericStyleProperty(property("opacity", number(1)), isZ)).toBeUndefined();
    expect(
      numericStyleProperty(property("zIndex", node({ type: "Literal", value: "10" })), isZ),
    ).toBeUndefined();
    expect(
      numericStyleProperty(
        node({
          type: "Property",
          key: node({ type: "Literal", value: "zIndex" }),
          value: number(3),
        }),
        isZ,
      ),
    ).toEqual({ key: "zIndex", value: 3 });
  });
});
