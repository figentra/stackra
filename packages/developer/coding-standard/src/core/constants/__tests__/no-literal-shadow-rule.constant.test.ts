/**
 * Stackra file contract:
 * Purpose: rule tests of `stackra/no-literal-shadow`: Tailwind shadow-size classes, arbitrary shadow literals and numeric native shadows are reported; the theme tokens, variables, colours and `shadow-none` pass.
 * Boundary: test only; runs the rule through oxlint's RuleTester with the runner from @stackra/testing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0501.
 */
import { describe, it } from "@stackra/testing";
import { RuleTester } from "oxlint/plugins-dev";

import { NO_LITERAL_SHADOW_RULE } from "#core/constants/no-literal-shadow-rule.constant";

RuleTester.describe = describe;
RuleTester.it = it;

const tester = new RuleTester({
  languageOptions: {
    sourceType: "module",
    parserOptions: { lang: "tsx", ecmaFeatures: { jsx: true } },
  },
});

tester.run(
  "no-literal-shadow",
  NO_LITERAL_SHADOW_RULE as unknown as Parameters<RuleTester["run"]>[1],
  {
    valid: [
      'const a = <div className="shadow-surface hover:shadow-overlay" />;',
      'const b = cn("shadow-(--raised-shadow)", "shadow-[var(--pressed-shadow)]", "shadow-none");',
      'const c = "a soft shadow under the card";',
      "const d = { shadowRadius: theme.radius, elevation: 0 };",
    ],
    invalid: [
      {
        code: 'const a = <div className="p-2 shadow-sm" />;',
        errors: [{ messageId: "shadowClass", data: { token: "shadow-sm" } }],
      },
      {
        code: 'const b = <div className="shadow" />;',
        errors: [{ messageId: "shadowClass", data: { token: "shadow" } }],
      },
      {
        code: 'const c = cn("data-[open=true]:shadow-xl");',
        errors: [{ messageId: "shadowClass", data: { token: "shadow-xl" } }],
      },
      {
        code: "const d = `${x} shadow-[0_0_0_1px_red]`;",
        errors: [{ messageId: "shadowClass", data: { token: "shadow-[0_0_0_1px_red]" } }],
      },
      {
        code: "const e = { shadowRadius: 8 };",
        errors: [{ messageId: "numericShadow", data: { key: "shadowRadius", value: "8" } }],
      },
    ],
  },
);
