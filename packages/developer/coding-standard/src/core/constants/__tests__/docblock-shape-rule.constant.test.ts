/**
 * Stackra file contract:
 * Purpose: rule tests of `stackra/docblock-shape`: one-line text in a multi-line block is collapsed; a tag in a
 *          one-line block is reported; multi-line text, tags, inline tags, package names, code spans, plain block
 *          comments and text too long for one line pass.
 * Boundary: test only; runs the rule through oxlint's RuleTester with the runner from @stackra/testing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing).
 */
import { describe, it } from "@stackra/testing";
import { RuleTester } from "oxlint/plugins-dev";

import { DOCBLOCK_SHAPE_RULE } from "#core/constants/docblock-shape-rule.constant";

RuleTester.describe = describe;
RuleTester.it = it;

const tester = new RuleTester({
  languageOptions: { sourceType: "module", parserOptions: { lang: "ts" } },
});
const LONG =
  "Returns the total of every line in the cart, in minor units, after discounts and before tax is added.";

tester.run("docblock-shape", DOCBLOCK_SHAPE_RULE as unknown as Parameters<RuleTester["run"]>[1], {
  valid: [
    "/** Tells the time. */\nexport const clock = 1;",
    "/**\n * Returns x.\n *\n * @example\n * x();\n */\nexport const x = 1;",
    "/**\n * The first line of text.\n * The second line of text.\n */\nexport const x = 1;",
    "/** See {@link Clock}. */\nexport const x = 1;",
    "/** Reads the @stackra/contracts types. */\nexport const x = 1;",
    "/** Write `@Int` on every number. */\nexport const x = 1;",
    "/* a plain block comment */\nexport const x = 1;",
    `/**\n * ${LONG}\n */\nexport const x = 1;`,
  ],
  invalid: [
    {
      code: "/**\n * Tells the time.\n */\nexport const clock = 1;",
      output: "/** Tells the time. */\nexport const clock = 1;",
      errors: [{ messageId: "oneLine", data: { text: "Tells the time." } }],
    },
    {
      code: "class Clock {\n  /**\n   * The current instant.\n   */\n  now = 0;\n}",
      output: "class Clock {\n  /** The current instant. */\n  now = 0;\n}",
      errors: [{ messageId: "oneLine" }],
    },
    {
      code: "/** @deprecated Use b. */\nexport const a = 1;",
      errors: [{ messageId: "multiLine" }],
    },
  ],
});
