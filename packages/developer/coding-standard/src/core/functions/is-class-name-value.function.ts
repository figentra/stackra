/**
 * Stackra file contract:
 * Purpose: `isClassNameValue`, whether a string node is the value of a JSX `className` attribute, where a bare
 *          utility (`rounded`, `shadow`) can only be a class.
 * Boundary: pure; reads the node's parent only.
 * Runtime: isomorphic
 * Governing contract: ADR 0129 (the house rules ship as an oxlint jsPlugin); ADR 0501 (the token lint rules).
 */
import type { AstNode } from "#core/types/ast-node.type";

/** True when `node` is the value of a JSX `className` attribute. */
export function isClassNameValue(node: AstNode): boolean {
  const attribute = node.parent;
  return (
    attribute?.type === "JSXAttribute" &&
    (attribute.name as unknown as AstNode | undefined)?.name === "className"
  );
}
