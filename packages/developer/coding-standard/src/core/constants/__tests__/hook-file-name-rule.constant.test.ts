/**
 * Stackra file contract:
 * Purpose: rule tests of `stackra/hook-file-name`: a `use<Name>` export in `use-<name>.ts(x)` passes, with or
 *          without a platform suffix; elsewhere it is reported. Non-hook exports are ignored.
 * Boundary: test only; runs the rule through oxlint's RuleTester with the runner from @stackra/testing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing).
 */
import { describe, it } from "@stackra/testing";
import { RuleTester } from "oxlint/plugins-dev";

import { HOOK_FILE_NAME_RULE } from "#core/constants/hook-file-name-rule.constant";

RuleTester.describe = describe;
RuleTester.it = it;

const tester = new RuleTester({ languageOptions: { sourceType: "module" } });

tester.run("hook-file-name", HOOK_FILE_NAME_RULE as unknown as Parameters<RuleTester["run"]>[1], {
  valid: [
    {
      filename: "src/components/cart/use-cart.ts",
      code: "export function useCart() {\n  return 1;\n}",
    },
    { filename: "src/hooks/use-cart-total.ts", code: "export const useCartTotal = () => 0;" },
    {
      filename: "src/components/cart/use-cart.native.ts",
      code: "export function useCart() {\n  return 1;\n}",
    },
    {
      filename: "src/hooks/use-http-url.ts",
      code: "export function useHTTPUrl() {\n  return 1;\n}",
    },
    { filename: "src/components/cart/cart.tsx", code: "export function user() {\n  return 1;\n}" },
    {
      filename: "src/components/cart/cart.tsx",
      code: "function useLocal() {\n  return 1;\n}\nuseLocal();",
    },
  ],
  invalid: [
    {
      filename: "src/components/cart/cart.tsx",
      code: "export function useCart() {\n  return 1;\n}",
      errors: [
        {
          messageId: "wrongFile",
          data: { name: "useCart", expected: "use-cart", actual: "cart.tsx" },
        },
      ],
    },
    {
      filename: "src/hooks/use-cart.ts",
      code: "export const useCartTotal = () => 0;",
      errors: [
        {
          messageId: "wrongFile",
          data: { name: "useCartTotal", expected: "use-cart-total", actual: "use-cart.ts" },
        },
      ],
    },
  ],
});
