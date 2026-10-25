/**
 * Stackra file contract:
 * Purpose: rule tests of `stackra/file-contract`: a file without the complete contract docblock is reported.
 * Boundary: test only; runs the rule through oxlint's RuleTester with the runner from @stackra/testing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing).
 */
import { describe, it } from "@stackra/testing";
import { RuleTester } from "oxlint/plugins-dev";

import { FILE_CONTRACT_RULE } from "#core/constants/file-contract-rule.constant";

RuleTester.describe = describe;
RuleTester.it = it;

const tester = new RuleTester({
  languageOptions: { sourceType: "module", parserOptions: { lang: "ts" } },
});

const FULL =
  "/**\n * Stackra file contract:\n * Purpose: x\n * Boundary: y\n * Runtime: isomorphic\n * Governing contract: ADR 1\n */\nexport const A = 1;";

tester.run("file-contract", FILE_CONTRACT_RULE as unknown as Parameters<RuleTester["run"]>[1], {
  valid: [FULL, `#!/usr/bin/env node\n${FULL}`, `"use client";\n${FULL}`],
  invalid: [
    { code: "export const A = 1;", errors: [{ messageId: "missing" }] },
    { code: "/** Tells the time. */\nexport const A = 1;", errors: [{ messageId: "missing" }] },
    { code: `export const B = 2;\n${FULL}`, errors: [{ messageId: "missing" }] },
    {
      code: "/**\n * Stackra file contract:\n * Purpose: x\n * Boundary: y\n * Runtime: isomorphic\n */\nexport const A = 1;",
      errors: [{ messageId: "incomplete", data: { label: "Governing contract:" } }],
    },
  ],
});
