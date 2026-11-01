/**
 * Stackra file contract:
 * Purpose: rule tests of `stackra/no-empty-decorator`: `@X()` and `@X({})` are reported without an autofix; a bare
 *          decorator, a decorator with options, and an empty call of a factory that must be called (`@Setting()`)
 *          pass.
 * Boundary: test only; runs the rule through oxlint's RuleTester with the runner from @stackra/testing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing).
 */
import { describe, it } from "@stackra/testing";
import { RuleTester } from "oxlint/plugins-dev";

import { NO_EMPTY_DECORATOR_RULE } from "#core/constants/no-empty-decorator-rule.constant";

RuleTester.describe = describe;
RuleTester.it = it;

const tester = new RuleTester({
  languageOptions: { sourceType: "module", parserOptions: { lang: "ts" } },
});

tester.run(
  "no-empty-decorator",
  NO_EMPTY_DECORATOR_RULE as unknown as Parameters<RuleTester["run"]>[1],
  {
    valid: [
      'class Order {\n  @Trim\n  name = "";\n}',
      "class Order {\n  @Int({ min: 0 })\n  total = 0;\n}",
      "@Searchable\nclass Order {}",
      '@Index(["tenantId", "status"])\nclass Order {}',
      "class Settings {\n  @Setting()\n  limit = 10;\n}",
      "class Settings {\n  @Setting({})\n  limit = 10;\n}",
      "class Billing {\n  @Step({})\n  async charge() {}\n}",
      "@Journaled({})\nclass Entry {}",
      "@Visibility({})\nclass Order {}",
    ],
    invalid: [
      {
        code: 'class Order {\n  @Trim()\n  name = "";\n}',
        errors: [{ messageId: "emptyDecorator", data: { name: "Trim" } }],
      },
      {
        code: "@Auditable({})\nclass Order {}",
        errors: [{ messageId: "emptyDecorator", data: { name: "Auditable" } }],
      },
    ],
  },
);
