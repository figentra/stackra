/**
 * Stackra file contract:
 * Purpose: `bodyOf`, the statement or member list of a program, a class or a class body, so the rules walk one
 *          array whatever node they start from.
 * Boundary: pure; reads `body` only and never mutates the tree.
 * Runtime: isomorphic
 * Governing contract: ADR 0129 (the house rules ship as an oxlint jsPlugin); ADR 0305 (one declaration per file).
 */
import type { AstNode } from "#core/types/ast-node.type";

/**
 * Returns the body list of `node`: a program's statements, or a class's members (through its `ClassBody`).
 * Returns an empty list for a node without a list body.
 */
export function bodyOf(node: AstNode | null | undefined): readonly AstNode[] {
  const body = node?.body;
  if (body === undefined || body === null) return [];
  if (Array.isArray(body)) return body as readonly AstNode[];
  return bodyOf(body as AstNode);
}
