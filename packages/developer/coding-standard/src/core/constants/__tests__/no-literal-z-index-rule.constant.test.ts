/**
 * Stackra file contract:
 * Purpose: rule tests of `stackra/no-literal-z-index`: literal z-index classes and numbers are reported; layer variables, `z-0` and `z-auto` pass.
 * Boundary: test only; runs the rule through oxlint's RuleTester with the runner from @stackra/testing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0501.
 */
import { describe, it } from "@stackra/testing";
import { RuleTester } from "oxlint/plugins-dev";

import { NO_LITERAL_Z_INDEX_RULE } from "#core/constants/no-literal-z-index-rule.constant";

RuleTester.describe = describe;
RuleTester.it = it;

const tester = new RuleTester({
  languageOptions: {
    sourceType: "module",
    parserOptions: { lang: "tsx", ecmaFeatures: { jsx: true } },
  },
});

tester.run(
  "no-literal-z-index",
  NO_LITERAL_Z_INDEX_RULE as unknown as Parameters<RuleTester["run"]>[1],
  {
    valid: [
      'const a = <div className="z-(--z-overlay) z-0 z-auto" />;',
      "const b = { zIndex: layers.overlay };",
      'const c = "z-index is a CSS property";',
    ],
    invalid: [
      {
        code: 'const a = <div className="fixed z-50" />;',
        errors: [{ messageId: "zClass", data: { token: "z-50" } }],
      },
      {
        code: 'const b = cn("-z-10");',
        errors: [{ messageId: "zClass", data: { token: "-z-10" } }],
      },
      {
        code: 'const c = cn("z-[3]");',
        errors: [{ messageId: "zClass", data: { token: "z-[3]" } }],
      },
      {
        code: "const d = { zIndex: 12 };",
        errors: [{ messageId: "numericZ", data: { value: "12" } }],
      },
    ],
  },
);
