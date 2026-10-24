/**
 * Stackra file contract:
 * Purpose: unit tests of `bodyOf`: a program's statements, a class's members through its class body, and nodes
 *          with no list body.
 * Boundary: test only; builds minimal nodes by hand, imports the subject through its `#core` alias and the runner
 *           through @stackra/testing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing).
 */
import { describe, expect, it } from "@stackra/testing";

import { bodyOf } from "#core/functions/body-of.function";
import type { AstNode } from "#core/types/ast-node.type";

const at = { start: { line: 1, column: 0 }, end: { line: 1, column: 0 } };
const node = (fields: Omit<AstNode, "range" | "loc">): AstNode => ({
  range: [0, 0],
  loc: at,
  ...fields,
});

describe("bodyOf", () => {
  const member = node({ type: "PropertyDefinition" });

  it("returns a program's statements", () => {
    const statement = node({ type: "ExpressionStatement" });
    expect(bodyOf(node({ type: "Program", body: [statement] }))).toEqual([statement]);
  });

  it("returns a class body's members", () => {
    expect(bodyOf(node({ type: "ClassBody", body: [member] }))).toEqual([member]);
  });

  it("reaches a class's members through its class body", () => {
    const classBody = node({ type: "ClassBody", body: [member] });
    expect(bodyOf(node({ type: "ClassDeclaration", body: classBody }))).toEqual([member]);
  });

  it("returns an empty list for a node without a list body", () => {
    expect(bodyOf(node({ type: "Identifier", name: "x" }))).toEqual([]);
    expect(bodyOf(node({ type: "ClassDeclaration", body: null }))).toEqual([]);
    expect(bodyOf(undefined)).toEqual([]);
  });
});
