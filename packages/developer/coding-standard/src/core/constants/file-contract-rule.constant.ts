/**
 * Stackra file contract:
 * Purpose: the `stackra/file-contract` rule: every source file opens with the `Stackra file contract:` docblock that
 *          carries `Purpose:`, `Boundary:`, `Runtime:` and `Governing contract:`.
 * Boundary: reads the first comment of the file only; it must be a `/** *\/` block that starts the file (a shebang or
 *           a directive may come before it). It checks the labels, not their text. No autofix: the text is prose.
 * Runtime: isomorphic
 * Governing contract: owner decision H (2026-10-24 final review, file-contract docblocks); ADR 0129 (decision 1);
 *                     registry v3.1 (final review H).
 */
import type { Rule } from "#core/types/rule.type";

const HEADER = "Stackra file contract:";
const LABELS = ["Purpose:", "Boundary:", "Runtime:", "Governing contract:"] as const;

/** Requires the `Stackra file contract:` docblock at the top of every file. */
export const FILE_CONTRACT_RULE: Rule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Require the Stackra file contract docblock with Purpose, Boundary, Runtime and Governing contract (owner H).",
    },
    messages: {
      missing:
        "The file starts with a `/** Stackra file contract: ... */` docblock (owner decision H).",
      incomplete:
        "The file contract docblock lacks `{{label}}` (Purpose, Boundary, Runtime, Governing contract; owner decision H).",
    },
    schema: [],
  },
  create(context) {
    return {
      Program(node) {
        const first = context.sourceCode
          .getAllComments()
          .find((comment) => comment.type !== "Shebang");
        const before = first ? context.sourceCode.text.slice(0, first.range[0]) : "";
        const isDocblock = first?.type === "Block" && first.value.startsWith("*");
        const isOpening = /^(?:\s|#!.*|["']use [a-z ]+["'];?)*$/.test(before);
        if (!first || !isDocblock || !isOpening || !first.value.includes(HEADER)) {
          context.report({ node, messageId: "missing" });
          return;
        }
        for (const label of LABELS) {
          if (!first.value.includes(label)) {
            context.report({ loc: first.loc, messageId: "incomplete", data: { label } });
          }
        }
      },
    };
  },
};
