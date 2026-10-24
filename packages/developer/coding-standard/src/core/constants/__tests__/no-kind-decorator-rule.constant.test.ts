/**
 * Stackra file contract:
 * Purpose: rule tests of `stackra/no-kind-decorator`: kind-named and retired decorators are reported, called or
 *          bare; the v3 field, method and class-facet decorators pass.
 * Boundary: test only; runs the rule through oxlint's RuleTester with the runner from @stackra/testing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing).
 */
import { describe, it } from "@stackra/testing";
import { RuleTester } from "oxlint/plugins-dev";

import { NO_KIND_DECORATOR_RULE } from "#core/constants/no-kind-decorator-rule.constant";

RuleTester.describe = describe;
RuleTester.it = it;

const tester = new RuleTester({
  languageOptions: { sourceType: "module", parserOptions: { lang: "ts" } },
});

tester.run(
  "no-kind-decorator",
  NO_KIND_DECORATOR_RULE as unknown as Parameters<RuleTester["run"]>[1],
  {
    valid: [
      "@Lifetime(Lifetime.Request)\nclass CartService extends Service {}",
      '@AccessLogged({ classification: "pii" })\nclass GetOrderQuery extends Query({ key: "order.get" }) {}',
      "class Order {\n  @Int({ min: 0 })\n  total = 0;\n\n  @ManyToOne(() => Customer)\n  customer = null;\n}",
      "class Checkout {\n  @Step({ retry: 3 })\n  async pay() {}\n}",
    ],
    invalid: [
      {
        code: '@Action({ key: "order.cancel" })\nclass CancelOrder {}',
        errors: [{ messageId: "kindDecorator", data: { name: "Action" } }],
      },
      {
        code: "@Injectable()\nclass CartService {}",
        errors: [{ messageId: "kindDecorator", data: { name: "Injectable" } }],
      },
      {
        code: "@Model\nclass Order {}",
        errors: [{ messageId: "kindDecorator", data: { name: "Model" } }],
      },
      {
        code: 'class Jobs {\n  @Cron("0 * * * *")\n  run() {}\n}',
        errors: [{ messageId: "kindDecorator", data: { name: "Cron" } }],
      },
    ],
  },
);
