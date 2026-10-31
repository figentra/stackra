/**
 * Stackra file contract:
 * Purpose: rule tests of `stackra/no-literal-length`: arbitrary px and rem utilities and numeric type and edge sizes are reported; scale steps, variables and em pass.
 * Boundary: test only; runs the rule through oxlint's RuleTester with the runner from @stackra/testing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0501.
 */
import { describe, it } from "@stackra/testing";
import { RuleTester } from "oxlint/plugins-dev";

import { NO_LITERAL_LENGTH_RULE } from "#core/constants/no-literal-length-rule.constant";

RuleTester.describe = describe;
RuleTester.it = it;

const tester = new RuleTester({
  languageOptions: {
    sourceType: "module",
    parserOptions: { lang: "tsx", ecmaFeatures: { jsx: true } },
  },
});

tester.run(
  "no-literal-length",
  NO_LITERAL_LENGTH_RULE as unknown as Parameters<RuleTester["run"]>[1],
  {
    valid: [
      'const a = <div className="h-112 w-(--size-panel) text-(length:--text-3xs) size-[1em]" />;',
      "const b = { fontSize: tokens.typeScale.xs.fontSize, borderWidth: 0 };",
      'const c = "a 10px gap";',
    ],
    invalid: [
      {
        code: 'const a = <div className="text-[10px]" />;',
        errors: [{ messageId: "lengthClass", data: { token: "text-[10px]" } }],
      },
      {
        code: 'const b = cn("md:max-w-[28rem]");',
        errors: [{ messageId: "lengthClass", data: { token: "max-w-[28rem]" } }],
      },
      {
        code: "const c = { fontSize: 10 };",
        errors: [{ messageId: "numericLength", data: { key: "fontSize", value: "10" } }],
      },
    ],
  },
);
