/**
 * Stackra file contract:
 * Purpose: rule tests of `stackra/no-parameter-decorator`: decorators on constructor parameters, parameter
 *          properties and method parameters are reported; class, field and method decorators pass.
 * Boundary: test only; runs the rule through oxlint's RuleTester with the runner from @stackra/testing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing).
 */
import { describe, it } from "@stackra/testing";
import { RuleTester } from "oxlint/plugins-dev";

import { NO_PARAMETER_DECORATOR_RULE } from "#core/constants/no-parameter-decorator-rule.constant";

RuleTester.describe = describe;
RuleTester.it = it;

const tester = new RuleTester({
  languageOptions: { sourceType: "module", parserOptions: { lang: "ts" } },
});
const errors = [{ messageId: "parameterDecorator" }];

tester.run(
  "no-parameter-decorator",
  NO_PARAMETER_DECORATOR_RULE as unknown as Parameters<RuleTester["run"]>[1],
  {
    valid: [
      "@Searchable\nclass Order {\n  @Int\n  total = 0;\n\n  @Step({ retry: 3 })\n  pay() {}\n}",
      "class CartService {\n  constructor(private readonly orders: OrderService) {}\n}",
    ],
    invalid: [
      {
        code: "class CartService {\n  constructor(@Inject(ORDERS) orders: OrderService) {}\n}",
        errors,
      },
      {
        code: "class CartService {\n  constructor(@Inject(ORDERS) private readonly orders: OrderService) {}\n}",
        errors,
      },
      { code: "class Cart {\n  add(@Body() item: Item) {}\n}", errors },
    ],
  },
);
