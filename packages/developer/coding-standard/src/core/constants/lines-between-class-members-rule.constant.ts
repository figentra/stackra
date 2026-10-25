/**
 * Stackra file contract:
 * Purpose: the `stackra/lines-between-class-members` rule: one blank line separates every pair of class members,
 *          with the autofix inserting it, so authored and generated classes read the same way.
 * Boundary: whitespace only. The blank line goes before the next member's leading comment or decorator; a trailing
 *           comment on the previous member's last line stays with that member.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (rule R9, lint autofixes one blank line between class members).
 */
import { bodyOf } from "#core/functions/body-of.function";
import type { AstNode } from "#core/types/ast-node.type";
import type { Rule } from "#core/types/rule.type";

/** Where a member really starts: its first decorator when it has one. */
const startOf = (member: AstNode): number =>
  Math.min(member.range[0], member.decorators?.[0]?.range[0] ?? Infinity);

/** Requires a blank line between class members. */
export const LINES_BETWEEN_CLASS_MEMBERS_RULE: Rule = {
  meta: {
    type: "layout",
    docs: { description: "Require one blank line between class members (ADR 0294 R9)." },
    fixable: "whitespace",
    messages: {
      blankLine: "Put one blank line between class members (ADR 0294 R9).",
    },
    schema: [],
  },
  create(context) {
    const { sourceCode } = context;
    return {
      ClassBody(node) {
        const members = bodyOf(node);
        const comments = sourceCode.getAllComments();
        for (let index = 1; index < members.length; index += 1) {
          const previous = members[index - 1];
          const next = members[index];
          if (previous === undefined || next === undefined) continue;
          const nextStart = startOf(next);
          let gapStart = previous.range[1];
          let gapEnd = nextStart;
          for (const comment of comments) {
            if (comment.range[0] < previous.range[1] || comment.range[1] > nextStart) continue;
            if (comment.loc.start.line === previous.loc.end.line)
              gapStart = Math.max(gapStart, comment.range[1]);
            else gapEnd = Math.min(gapEnd, comment.range[0]);
          }
          const breaks = sourceCode.text.slice(gapStart, gapEnd).split("\n").length - 1;
          if (breaks >= 2) continue;
          context.report({
            node: next,
            messageId: "blankLine",
            fix: (fixer) =>
              fixer.insertTextAfterRange([gapStart, gapStart], "\n".repeat(2 - breaks)),
          });
        }
      },
    };
  },
};
