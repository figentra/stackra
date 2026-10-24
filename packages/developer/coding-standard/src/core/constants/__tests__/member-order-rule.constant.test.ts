/**
 * Stackra file contract:
 * Purpose: rule tests of `stackra/member-order`: a class in the full house order passes; a member below a later
 *          group is reported, once per class.
 * Boundary: test only; runs the rule through oxlint's RuleTester with the runner from @stackra/testing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing).
 */
import { describe, it } from "@stackra/testing";
import { RuleTester } from "oxlint/plugins-dev";

import { MEMBER_ORDER_RULE } from "#core/constants/member-order-rule.constant";

RuleTester.describe = describe;
RuleTester.it = it;

const tester = new RuleTester({
  languageOptions: { sourceType: "module", parserOptions: { lang: "ts" } },
});

const ORDERED = [
  "class Cart {",
  '  static readonly KIND = "cart";',
  "  static count = 0;",
  "  @Int",
  "  total = 0;",
  '  readonly id = "c1";',
  '  name = "";',
  "  protected lines = 0;",
  "  private cache = 0;",
  "  constructor() {}",
  "  static of() {",
  "    return new Cart();",
  "  }",
  "  get size() {",
  "    return 1;",
  "  }",
  "  onApplicationShutdown() {}",
  "  add() {}",
  "  protected recount() {}",
  "  private flush() {}",
  "}",
].join("\n");

tester.run("member-order", MEMBER_ORDER_RULE as unknown as Parameters<RuleTester["run"]>[1], {
  valid: [ORDERED, "class Empty {}"],
  invalid: [
    {
      code: 'class Cart {\n  add() {}\n  name = "";\n}',
      errors: [
        {
          messageId: "outOfOrder",
          data: {
            name: "name",
            group: "public field",
            previous: "add",
            previousGroup: "public method",
          },
        },
      ],
    },
    {
      code: "class Cart {\n  private flush() {}\n  add() {}\n}",
      errors: [
        {
          messageId: "outOfOrder",
          data: {
            name: "add",
            group: "public method",
            previous: "flush",
            previousGroup: "private method",
          },
        },
      ],
    },
    {
      code: 'class Cart {\n  constructor() {}\n  static readonly KIND = "cart";\n  name = "";\n}',
      errors: [
        {
          messageId: "outOfOrder",
          data: {
            name: "KIND",
            group: "static readonly field",
            previous: "constructor",
            previousGroup: "constructor",
          },
        },
      ],
    },
  ],
});
