/**
 * Stackra file contract:
 * Purpose: rule tests of `stackra/no-empty-module`: a bare or empty-options module class with no members is
 *          reported; a module with options or members passes; other files are ignored.
 * Boundary: test only; runs the rule through oxlint's RuleTester with the runner from @stackra/testing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing).
 */
import { describe, it } from "@stackra/testing";
import { RuleTester } from "oxlint/plugins-dev";

import { NO_EMPTY_MODULE_RULE } from "#core/constants/no-empty-module-rule.constant";

RuleTester.describe = describe;
RuleTester.it = it;

const tester = new RuleTester({
  languageOptions: { sourceType: "module", parserOptions: { lang: "ts" } },
});
const MODULE_FILE = "src/modules/orders/orders.module.ts";
const errors = [{ messageId: "emptyModule", data: { name: "OrdersModule" } }];

tester.run("no-empty-module", NO_EMPTY_MODULE_RULE as unknown as Parameters<RuleTester["run"]>[1], {
  valid: [
    {
      filename: MODULE_FILE,
      code: "export class OrdersModule extends Module({ exports: [OrderService] }) {}",
    },
    {
      filename: "src/commerce.module.ts",
      code: "export class CommerceModule extends Module({ wrap: Shell }) {}",
    },
    {
      filename: "src/modules/orders/services/orders.service.ts",
      code: "export class OrdersService extends Module {}",
    },
  ],
  invalid: [
    { filename: MODULE_FILE, code: "export class OrdersModule extends Module {}", errors },
    { filename: MODULE_FILE, code: "export class OrdersModule extends Module({}) {}", errors },
    { filename: MODULE_FILE, code: "export class OrdersModule extends Module() {}", errors },
  ],
});
