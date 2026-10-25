/**
 * Stackra file contract:
 * Purpose: rule tests of `stackra/multiline-decorator-options`: base-factory and decorator option objects with two
 *          or more properties are expanded one per line; a single property, an expanded object and a nested object
 *          pass; an object holding a comment is reported without an autofix.
 * Boundary: test only; runs the rule through oxlint's RuleTester with the runner from @stackra/testing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing).
 */
import { describe, it } from "@stackra/testing";
import { RuleTester } from "oxlint/plugins-dev";

import { MULTILINE_DECORATOR_OPTIONS_RULE } from "#core/constants/multiline-decorator-options-rule.constant";

RuleTester.describe = describe;
RuleTester.it = it;

const tester = new RuleTester({
  languageOptions: { sourceType: "module", parserOptions: { lang: "ts" } },
});
const errors = [{ messageId: "onePerLine" }];

tester.run(
  "multiline-decorator-options",
  MULTILINE_DECORATOR_OPTIONS_RULE as unknown as Parameters<RuleTester["run"]>[1],
  {
    valid: [
      'class CancelOrderAction extends Action({ key: "order.cancel" }) {}',
      'class CancelOrderAction extends Action({\n  key: "order.cancel",\n  actors: [],\n}) {}',
      'class Order {\n  @Str({ max: 200 })\n  name = "";\n}',
      "class Order {\n  @Int\n  total = 0;\n}",
      'const options = { key: "a", actors: [] };',
    ],
    invalid: [
      {
        code: 'class CancelOrderAction extends Action({ key: "order.cancel", actors: [] }) {}',
        output:
          'class CancelOrderAction extends Action({\n  key: "order.cancel",\n  actors: [],\n}) {}',
        errors,
      },
      {
        code: 'class Order {\n  @Str({ min: 1, max: 200 })\n  name = "";\n}',
        output: 'class Order {\n  @Str({\n    min: 1,\n    max: 200,\n  })\n  name = "";\n}',
        errors,
      },
      {
        code: 'class Orders extends Widget.place(BaseWidget, { slot: "home", size: 2 }) {}',
        output:
          'class Orders extends Widget.place(BaseWidget, {\n  slot: "home",\n  size: 2,\n}) {}',
        errors,
      },
      {
        code: 'class Order {\n  @Str({ min: 1, /* a name has a letter */ max: 200 })\n  name = "";\n}',
        output: null,
        errors,
      },
    ],
  },
);
