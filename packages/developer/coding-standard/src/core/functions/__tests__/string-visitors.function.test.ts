/**
 * Stackra file contract:
 * Purpose: unit tests of `stringVisitors` and `isClassNameValue`: string literals and template chunks reach the
 *          check, other literals do not, and a className attribute's value is told apart.
 * Boundary: test only; builds minimal nodes by hand, imports the subjects through their `#core` aliases and the runner
 *           through @stackra/testing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing).
 */
import { describe, expect, it } from "@stackra/testing";

import { isClassNameValue } from "#core/functions/is-class-name-value.function";
import { stringVisitors } from "#core/functions/string-visitors.function";
import type { AstNode } from "#core/types/ast-node.type";

const at = { start: { line: 1, column: 0 }, end: { line: 1, column: 0 } };
const node = (fields: Omit<AstNode, "range" | "loc">): AstNode => ({
  range: [0, 0],
  loc: at,
  ...fields,
});

describe("stringVisitors", () => {
  it("hands string literals and cooked template chunks to the check, and nothing else", () => {
    const calls: [AstNode, string][] = [];
    const visitors = stringVisitors((seen, text) => calls.push([seen, text]));
    const text = node({ type: "Literal", value: "z-10" });
    const chunk = node({ type: "TemplateElement", value: { cooked: "rounded-lg" } });
    visitors.Literal(text);
    visitors.Literal(node({ type: "Literal", value: 3 }));
    visitors.TemplateElement(chunk);
    visitors.TemplateElement(node({ type: "TemplateElement", value: { cooked: null } }));
    expect(calls).toEqual([
      [text, "z-10"],
      [chunk, "rounded-lg"],
    ]);
  });
});

describe("isClassNameValue", () => {
  it("is true only for the value of a className attribute", () => {
    const attribute = (name: string) =>
      node({
        type: "JSXAttribute",
        // The AST types an attribute name as a string; the parser gives a JSXIdentifier node.
        name: node({ type: "JSXIdentifier", name }) as unknown as string,
      });
    expect(isClassNameValue(node({ type: "Literal", parent: attribute("className") }))).toBe(true);
    expect(isClassNameValue(node({ type: "Literal", parent: attribute("title") }))).toBe(false);
    expect(isClassNameValue(node({ type: "Literal" }))).toBe(false);
  });
});
