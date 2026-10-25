/**
 * Stackra file contract:
 * Purpose: rule tests of `stackra/no-hash-private`: `#name` fields and methods are reported once per declaration;
 *          the `private` keyword passes.
 * Boundary: test only; runs the rule through oxlint's RuleTester with the runner from @stackra/testing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing).
 */
import { describe, it } from "@stackra/testing";
import { RuleTester } from "oxlint/plugins-dev";

import { NO_HASH_PRIVATE_RULE } from "#core/constants/no-hash-private-rule.constant";

RuleTester.describe = describe;
RuleTester.it = it;

const tester = new RuleTester({
  languageOptions: { sourceType: "module", parserOptions: { lang: "ts" } },
});

tester.run("no-hash-private", NO_HASH_PRIVATE_RULE as unknown as Parameters<RuleTester["run"]>[1], {
  valid: ["class Cart {\n  private total = 0;\n\n  private add() {}\n}"],
  invalid: [
    {
      code: "class Cart {\n  #total = 0;\n\n  read() {\n    return this.#total;\n  }\n}",
      errors: [{ messageId: "noHashPrivate", data: { name: "total" } }],
    },
    {
      code: "class Cart {\n  #add() {}\n}",
      errors: [{ messageId: "noHashPrivate", data: { name: "add" } }],
    },
  ],
});
