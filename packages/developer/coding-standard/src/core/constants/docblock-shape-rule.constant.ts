/**
 * Stackra file contract:
 * Purpose: the `stackra/docblock-shape` rule: a TSDoc block of one line of text is written on one line
 *          (`/** Tells the time. *\/`), and a block with a tag (`@param`, `@example`) or more lines is multi-line.
 * Boundary: reads `/** *\/` comments only. Inline tags (`{@link X}`) and code spans do not count as tags. A block is
 *           collapsed only when the one-line form fits the 100-column print width; the autofix collapses it.
 * Runtime: isomorphic
 * Governing contract: owner decision R-11 (2026-10-24, docblock shape); ADR 0294 (rule R9, a one-line TSDoc on
 *                     every member); ADR 0007 as amended by ADR 0268.
 */
import type { Rule } from "#core/types/rule.type";

const PRINT_WIDTH = 100;
// A tag is `@word` followed by whitespace, `{` or the end, so `@stackra/contracts` in prose is not one.
const BLOCK_TAG = /(?:^|\s)@[A-Za-z]+(?=\s|\{|$)/;

/** Whether `text` carries a block tag, ignoring inline tags and code spans. */
const hasBlockTag = (text: string): boolean =>
  BLOCK_TAG.test(text.replaceAll(/\{@[^}]*\}/g, "").replaceAll(/`[^`]*`/g, ""));

/** The non-empty text lines of a `/** *\/` comment value, gutters stripped. */
const textLines = (value: string): string[] =>
  value
    .slice(1)
    .split("\n")
    .map((line, index) => (index === 0 ? line : line.replace(/^\s*\*?/, "")).trim())
    .filter((line) => line.length > 0);

/** Requires one-line docblocks for one line of text and multi-line docblocks for tags. */
export const DOCBLOCK_SHAPE_RULE: Rule = {
  meta: {
    type: "layout",
    docs: {
      description:
        "Require one-line TSDoc for a single line of text and multi-line TSDoc for tags (owner R-11).",
    },
    fixable: "whitespace",
    messages: {
      oneLine:
        "A docblock with one line of text is written on one line: `/** {{text}} */` (owner R-11).",
      multiLine:
        "A docblock with a tag is written over several lines, one tag per line (owner R-11).",
    },
    schema: [],
  },
  create(context) {
    return {
      Program() {
        for (const comment of context.sourceCode.getAllComments()) {
          if (
            comment.type !== "Block" ||
            !comment.value.startsWith("*") ||
            comment.value.startsWith("**")
          )
            continue;
          const lines = textLines(comment.value);
          const [only] = lines;
          if (only === undefined) continue;
          const isOneLine = !comment.value.includes("\n");
          if (isOneLine) {
            if (hasBlockTag(only)) context.report({ loc: comment.loc, messageId: "multiLine" });
            continue;
          }
          if (lines.length !== 1 || hasBlockTag(only)) continue;
          const collapsed = `/** ${only} */`;
          if (comment.loc.start.column + collapsed.length > PRINT_WIDTH) continue;
          context.report({
            loc: comment.loc,
            messageId: "oneLine",
            data: { text: only },
            fix: (fixer) => fixer.replaceTextRange(comment.range, collapsed),
          });
        }
      },
    };
  },
};
