/**
 * Stackra file contract:
 * Purpose: rule tests of `stackra/no-raw-env`: named reads of `process.env` and `import.meta.env` (member, computed,
 *          destructure) are reported; passing the whole object, configuration classes, generated code, tooling and
 *          tests are not.
 * Boundary: test only; runs the rule through oxlint's RuleTester with the runner from @stackra/testing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0173 (amendment
 *                     2026-11-04).
 */
import { describe, it } from "@stackra/testing";
import { RuleTester } from "oxlint/plugins-dev";

import { NO_RAW_ENV_RULE } from "#core/constants/no-raw-env-rule.constant";

RuleTester.describe = describe;
RuleTester.it = it;

const tester = new RuleTester({
  languageOptions: { sourceType: "module", parserOptions: { lang: "ts" } },
});

tester.run("no-raw-env", NO_RAW_ENV_RULE as unknown as Parameters<RuleTester["run"]>[1], {
  valid: [
    { filename: "src/boot.ts", code: "const config = hydrateEnv(Config, process.env);" },
    { filename: "src/boot.ts", code: "const source = import.meta.env;" },
    { filename: "src/a.ts", code: "const env = other.env.X; const b = process.argv;" },
    { filename: "src/core/acme.config.ts", code: "const a = process.env.ACME_URL;" },
    { filename: "vite.config.ts", code: "const a = process.env.PORT;" },
    { filename: ".stackra/encore/main.ts", code: "const a = process.env.X;" },
    { filename: "src/a.generated.ts", code: "const a = import.meta.env.VITE_X;" },
    { filename: "tools/scripts/a.mjs", code: "const a = process.env.CI;" },
    { filename: "src/core/__tests__/a.test.ts", code: "const a = process.env.X;" },
    { filename: "src/a.spec.ts", code: "const { X } = process.env;" },
  ],
  invalid: [
    {
      filename: "src/a.ts",
      code: "const a = process.env.STRIPE_SECRET_KEY;",
      errors: [{ messageId: "rawEnv", data: { name: "STRIPE_SECRET_KEY", object: "process.env" } }],
    },
    {
      filename: "src/a.ts",
      code: 'const a = process.env["X_Y"]; const b = process.env[name];',
      errors: [
        { messageId: "rawEnv", data: { name: "X_Y", object: "process.env" } },
        { messageId: "rawEnv", data: { name: "[computed]", object: "process.env" } },
      ],
    },
    {
      filename: "src/a.tsx",
      code: "const a = import.meta.env.VITE_API_ORIGIN;",
      errors: [
        { messageId: "rawEnv", data: { name: "VITE_API_ORIGIN", object: "import.meta.env" } },
      ],
    },
    {
      filename: "src/a.ts",
      code: "const { A, B } = process.env;",
      errors: [
        { messageId: "rawEnv", data: { name: "A", object: "process.env" } },
        { messageId: "rawEnv", data: { name: "B", object: "process.env" } },
      ],
    },
  ],
});
