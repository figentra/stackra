/**
 * Stackra file contract:
 * Purpose: the `stackra/disable-needs-reason` rule: an `oxlint-disable` (or `eslint-disable`) comment names the
 *          rules it turns off and gives a reason after ` -- `, so every suppression is explained where it sits.
 * Boundary: reads comments only; `oxlint-enable` needs nothing. No autofix: only the author knows the reason.
 * Runtime: isomorphic
 * Governing contract: ADR 0129 (decision 1); ADR 0007 as amended by ADR 0268 (a disable names the rule and a reason).
 */
import type { Rule } from "#core/types/rule.type";

const DIRECTIVE = /^\s*(?:oxlint|eslint)-disable(?:-next-line|-line)?(?=\s|$)(?<rest>[\s\S]*)$/;
const REASON_SEPARATOR = /\s--(?:\s|$)/;

/** Requires a rule name and a ` -- reason` on every disable comment. */
export const DISABLE_NEEDS_REASON_RULE: Rule = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Require a disable comment to name its rules and give a reason after ` -- ` (ADR 0129).",
    },
    messages: {
      missingRule:
        "A disable comment names the rules it turns off, as in `oxlint-disable-next-line <rule> -- <reason>` " +
        "(ADR 0129).",
      missingReason:
        "A disable comment gives its reason after ` -- `, as in `oxlint-disable-next-line <rule> -- <reason>` " +
        "(ADR 0129).",
    },
    schema: [],
  },
  create(context) {
    return {
      Program() {
        for (const comment of context.sourceCode.getAllComments()) {
          const rest = DIRECTIVE.exec(comment.value)?.groups?.["rest"];
          if (rest === undefined) continue;
          const [rules = "", ...reason] = rest.split(REASON_SEPARATOR);
          if (rules.trim() === "") {
            context.report({ loc: comment.loc, messageId: "missingRule" });
          } else if (reason.join(" -- ").trim() === "") {
            context.report({ loc: comment.loc, messageId: "missingReason" });
          }
        }
      },
    };
  },
};
