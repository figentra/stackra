/**
 * Stackra file contract:
 * Purpose: `stringVisitors`, the `Literal` and `TemplateElement` handlers that hand every string literal and every
 *          template chunk to one check, so the class-literal rules (`no-literal-*`, `no-backdrop-filter`) read text the
 *          same way.
 * Boundary: pure; reads `value` (and a template's `cooked` text) only and never mutates the tree.
 * Runtime: isomorphic
 * Governing contract: ADR 0129 (the house rules ship as an oxlint jsPlugin); ADR 0501 (the token lint rules).
 */
import type { AstNode } from "#core/types/ast-node.type";

/** Visitors that call `check` with each string literal and each template chunk's cooked text. */
export function stringVisitors(
  check: (node: AstNode, text: string) => void,
): Readonly<Record<"Literal" | "TemplateElement", (node: AstNode) => void>> {
  return {
    Literal(node) {
      if (typeof node.value === "string") check(node, node.value);
    },
    TemplateElement(node) {
      const cooked = (node.value as { cooked?: string | null } | undefined)?.cooked;
      if (typeof cooked === "string") check(node, cooked);
    },
  };
}
