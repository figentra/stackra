/**
 * Stackra file contract:
 * Purpose: unit tests of `rootIdentifier`: identifiers, calls, member calls, generic instantiations and expressions
 *          that start from no identifier.
 * Boundary: test only; builds minimal nodes by hand, imports the subject through its `#core` alias and the runner
 *           through @stackra/testing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing).
 */
import { describe, expect, it } from "@stackra/testing";

import { rootIdentifier } from "#core/functions/root-identifier.function";
import type { AstNode } from "#core/types/ast-node.type";

const at = { start: { line: 1, column: 0 }, end: { line: 1, column: 0 } };
const node = (fields: Omit<AstNode, "range" | "loc">): AstNode => ({
  range: [0, 0],
  loc: at,
  ...fields,
});
const id = (name: string): AstNode => node({ type: "Identifier", name });

describe("rootIdentifier", () => {
  it("returns an identifier's name", () => {
    expect(rootIdentifier(id("Schema"))).toBe("Schema");
  });

  it("walks a call to its callee: Action({ key })", () => {
    expect(
      rootIdentifier(node({ type: "CallExpression", callee: id("Action"), arguments: [] })),
    ).toBe("Action");
  });

  it("walks a member call to its object: Model.with(...)", () => {
    const callee = node({ type: "MemberExpression", object: id("Model") });
    expect(rootIdentifier(node({ type: "CallExpression", callee, arguments: [] }))).toBe("Model");
  });

  it("walks a generic instantiation: Resource<Order>", () => {
    expect(
      rootIdentifier(node({ type: "TSInstantiationExpression", expression: id("Resource") })),
    ).toBe("Resource");
  });

  it("returns undefined for an expression that starts from no identifier", () => {
    expect(rootIdentifier(node({ type: "ThisExpression" }))).toBeUndefined();
    expect(rootIdentifier(null)).toBeUndefined();
    expect(rootIdentifier(undefined)).toBeUndefined();
  });
});
