/**
 * Stackra file contract:
 * Purpose: `rootIdentifier`, the identifier an expression starts from, so `Action({ key })`, `Model.with(...)`,
 *          `Resource<Order>({ ... })` and `@Setting({ ... })` all resolve to the name a rule compares.
 * Boundary: pure; walks calls, member accesses and TypeScript wrappers, never resolves imports.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (rule R3, the kind is the root identifier of the `extends` expression; rule R6).
 */
import type { AstNode } from "#core/types/ast-node.type";

/**
 * Returns the name of the identifier at the root of `node`, or `undefined` when the expression does not start
 * from one (a literal, `this`, a class expression).
 *
 * @example
 * ```ts
 * // extends Widget.place(BaseWidget, { slot }) → "Widget"
 * rootIdentifier(classNode.superClass);
 * ```
 */
export function rootIdentifier(node: AstNode | null | undefined): string | undefined {
  switch (node?.type) {
    case "Identifier":
      return node.name;
    case "CallExpression":
      return rootIdentifier(node.callee);
    case "MemberExpression":
      return rootIdentifier(node.object);
    case "TSInstantiationExpression":
    case "TSNonNullExpression":
    case "TSAsExpression":
    case "ParenthesizedExpression":
      return rootIdentifier(node.expression);
    default:
      return undefined;
  }
}
