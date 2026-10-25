/**
 * Stackra file contract:
 * Purpose: rule tests of `stackra/one-declaration-per-file`: one exported name passes (enum const and type, overloads,
 *          a default of the same name, re-export barrels); a second exported name is reported once per extra name.
 * Boundary: test only; runs the rule through oxlint's RuleTester with the runner from @stackra/testing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing).
 */
import { describe, it } from "@stackra/testing";
import { RuleTester } from "oxlint/plugins-dev";

import { ONE_DECLARATION_PER_FILE_RULE } from "#core/constants/one-declaration-per-file-rule.constant";

RuleTester.describe = describe;
RuleTester.it = it;

const tester = new RuleTester({
  languageOptions: { sourceType: "module", parserOptions: { lang: "ts" } },
});

tester.run(
  "one-declaration-per-file",
  ONE_DECLARATION_PER_FILE_RULE as unknown as Parameters<RuleTester["run"]>[1],
  {
    valid: [
      'export const Color = Enum.of({ Red: "red" });\nexport type Color = (typeof Color)[keyof typeof Color];',
      "export function sum(a: number): number;\nexport function sum(a: string): string;\nexport function sum(a: unknown) {\n  return a;\n}",
      'export { Enum } from "./enum.base";\nexport { Port } from "./port.base";\nexport * from "./types";',
      "export const STACKRA_PLUGIN = {};\nexport default STACKRA_PLUGIN;",
      "export default {};",
      "const helper = 1;\nexport class Cart {\n  total = helper;\n}",
    ],
    invalid: [
      {
        code: "export const A = 1;\nexport const B = 2;",
        errors: [{ messageId: "secondDeclaration", data: { first: "A", name: "B" } }],
      },
      {
        code: "export class Cart {}\nexport interface CartProps {}\nexport type CartState = {};",
        errors: [
          { messageId: "secondDeclaration", data: { first: "Cart", name: "CartProps" } },
          { messageId: "secondDeclaration", data: { first: "Cart", name: "CartState" } },
        ],
      },
      {
        code: "const a = 1;\nconst b = 2;\nexport { a, b };",
        errors: [{ messageId: "secondDeclaration", data: { first: "a", name: "b" } }],
      },
    ],
  },
);
