/**
 * Stackra file contract:
 * Purpose: `reportFirstMatch`, the check a class-literal rule hands to `stringVisitors`: it reports the first capture
 *          of the rule's pattern in a string as `{{token}}`.
 * Boundary: pure apart from the report it files through the rule context.
 * Runtime: isomorphic
 * Governing contract: ADR 0129 (the house rules ship as an oxlint jsPlugin); ADR 0501 (the token lint rules).
 */
import type { AstNode } from "#core/types/ast-node.type";
import type { RuleContext } from "#core/types/rule-context.type";

/** A check that reports `pattern`'s first capture in a string under `messageId`, with the capture as `token`. */
export function reportFirstMatch(
  context: RuleContext,
  pattern: RegExp,
  messageId: string,
): (node: AstNode, text: string) => void {
  return (node, text) => {
    const token = pattern.exec(text)?.[1];
    if (token !== undefined) context.report({ node, messageId, data: { token } });
  };
}
