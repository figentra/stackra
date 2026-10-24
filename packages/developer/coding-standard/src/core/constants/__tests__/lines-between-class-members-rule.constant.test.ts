/**
 * Stackra file contract:
 * Purpose: rule tests of `stackra/lines-between-class-members`: adjacent members get one blank line from the
 *          autofix, placed before a leading docblock or decorator and after a same-line trailing comment.
 * Boundary: test only; runs the rule through oxlint's RuleTester with the runner from @stackra/testing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing).
 */
import { describe, it } from "@stackra/testing";
import { RuleTester } from "oxlint/plugins-dev";

import { LINES_BETWEEN_CLASS_MEMBERS_RULE } from "#core/constants/lines-between-class-members-rule.constant";

RuleTester.describe = describe;
RuleTester.it = it;

const tester = new RuleTester({
  languageOptions: { sourceType: "module", parserOptions: { lang: "ts" } },
});
const errors = [{ messageId: "blankLine" }];

tester.run(
  "lines-between-class-members",
  LINES_BETWEEN_CLASS_MEMBERS_RULE as unknown as Parameters<RuleTester["run"]>[1],
  {
    valid: [
      "class Cart {\n  total = 0;\n\n  add() {}\n}",
      "class Cart {\n  total = 0;\n\n  /** Adds one. */\n  add() {}\n}",
      "class Cart {\n  total = 0;\n}",
      "class Cart {}",
    ],
    invalid: [
      {
        code: "class Cart {\n  total = 0;\n  count = 0;\n}",
        output: "class Cart {\n  total = 0;\n\n  count = 0;\n}",
        errors,
      },
      {
        code: "class Cart {\n  total = 0;\n  /** The count. */\n  count = 0;\n}",
        output: "class Cart {\n  total = 0;\n\n  /** The count. */\n  count = 0;\n}",
        errors,
      },
      {
        code: "class Cart {\n  total = 0; // in cents\n  count = 0;\n}",
        output: "class Cart {\n  total = 0; // in cents\n\n  count = 0;\n}",
        errors,
      },
      {
        code: "class Cart {\n  total = 0;\n  @Int\n  count = 0;\n}",
        output: "class Cart {\n  total = 0;\n\n  @Int\n  count = 0;\n}",
        errors,
      },
      {
        code: "class Cart {\n  add() {}\n  remove() {}\n  clear() {}\n}",
        output: "class Cart {\n  add() {}\n\n  remove() {}\n\n  clear() {}\n}",
        errors: [{ messageId: "blankLine" }, { messageId: "blankLine" }],
      },
    ],
  },
);
