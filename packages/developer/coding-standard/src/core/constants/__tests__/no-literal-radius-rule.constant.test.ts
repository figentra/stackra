/**
 * Stackra file contract:
 * Purpose: rule tests of `stackra/no-literal-radius`: `rounded-*` class literals (plain, variant-prefixed, in a
 *          template) and numeric `borderRadius` keys are reported; token-driven code and prose saying "rounded" pass.
 * Boundary: test only; runs the rule through oxlint's RuleTester with the runner from @stackra/testing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0302.
 */
import { describe, it } from "@stackra/testing";
import { RuleTester } from "oxlint/plugins-dev";

import { NO_LITERAL_RADIUS_RULE } from "#core/constants/no-literal-radius-rule.constant";

RuleTester.describe = describe;
RuleTester.it = it;

const tester = new RuleTester({
  languageOptions: {
    sourceType: "module",
    parserOptions: { lang: "tsx", ecmaFeatures: { jsx: true } },
  },
});

tester.run(
  "no-literal-radius",
  NO_LITERAL_RADIUS_RULE as unknown as Parameters<RuleTester["run"]>[1],
  {
    valid: [
      'const a = <Card className="p-4 gap-2" />;',
      'const b = "Buttons with rounded corners";',
      'const c = { borderRadius: "var(--radius-field)" };',
      "const d = { borderRadius: theme.radius.field };",
      "const e = { padding: 8, borderWidth: 1 };",
    ],
    invalid: [
      {
        code: 'const a = <div className="rounded-full bg-accent" />;',
        errors: [{ messageId: "roundedClass", data: { token: "rounded-full" } }],
      },
      {
        code: 'const b = <div className="p-2 rounded" />;',
        errors: [{ messageId: "roundedClass", data: { token: "rounded" } }],
      },
      {
        code: 'const c = cn("p-2", "md:hover:rounded-2xl");',
        errors: [{ messageId: "roundedClass", data: { token: "rounded-2xl" } }],
      },
      {
        code: "const d = `gap-1 ${x} rounded-[12px]`;",
        errors: [{ messageId: "roundedClass", data: { token: "rounded-[12px]" } }],
      },
      {
        code: "const e = { borderRadius: 12 };",
        errors: [{ messageId: "numericRadius", data: { key: "borderRadius", value: "12" } }],
      },
      {
        code: "const f = { borderTopStartRadius: -4 };",
        errors: [{ messageId: "numericRadius", data: { key: "borderTopStartRadius", value: "4" } }],
      },
    ],
  },
);
