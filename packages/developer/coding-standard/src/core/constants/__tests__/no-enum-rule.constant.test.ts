/**
 * Stackra file contract:
 * Purpose: rule tests of `stackra/no-enum`: `enum` and `const enum` are reported; `Enum.of` passes.
 * Boundary: test only; runs the rule through oxlint's RuleTester with the runner from @stackra/testing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing).
 */
import { describe, it } from "@stackra/testing";
import { RuleTester } from "oxlint/plugins-dev";

import { NO_ENUM_RULE } from "#core/constants/no-enum-rule.constant";

RuleTester.describe = describe;
RuleTester.it = it;

const tester = new RuleTester({
  languageOptions: { sourceType: "module", parserOptions: { lang: "ts" } },
});

tester.run("no-enum", NO_ENUM_RULE as unknown as Parameters<RuleTester["run"]>[1], {
  valid: [
    'export const Color = Enum.of({ Red: "red", Blue: "blue" });\nexport type Color = (typeof Color)[keyof typeof Color];',
  ],
  invalid: [
    {
      code: "enum Color { Red, Blue }",
      errors: [{ messageId: "noEnum", data: { name: "Color" } }],
    },
    {
      code: "export const enum Mode { A = 1 }",
      errors: [{ messageId: "noEnum", data: { name: "Mode" } }],
    },
  ],
});
