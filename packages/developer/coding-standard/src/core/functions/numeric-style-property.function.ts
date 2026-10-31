/**
 * Stackra file contract:
 * Purpose: `numericStyleProperty`, the key and number of an object property such as `zIndex: 10` or
 *          `borderRadius: -4`, so the token lint rules find a hard-coded style number the same way.
 * Boundary: pure; reads the property's key and value only and never mutates the tree.
 * Runtime: isomorphic
 * Governing contract: ADR 0129 (the house rules ship as an oxlint jsPlugin); ADR 0501 (the token lint rules).
 */
import type { AstNode } from "#core/types/ast-node.type";

/**
 * Returns the key and number of `property` when its key passes `isKey` and its value is a non-zero numeric literal.
 * With `anyNumber`, zero and a negative number (a `UnaryExpression` around the literal) count too.
 */
export function numericStyleProperty(
  property: AstNode,
  isKey: (key: string) => boolean,
  anyNumber = false,
): { readonly key: string; readonly value: number } | undefined {
  const key = property.key?.type === "Identifier" ? property.key.name : property.key?.value;
  const value = property.value as AstNode | undefined;
  const literal = anyNumber && value?.type === "UnaryExpression" ? value.argument : value;
  if (typeof key !== "string" || !isKey(key) || literal?.type !== "Literal") return undefined;
  if (typeof literal.value !== "number" || (literal.value === 0 && !anyNumber)) return undefined;
  return { key, value: literal.value };
}
