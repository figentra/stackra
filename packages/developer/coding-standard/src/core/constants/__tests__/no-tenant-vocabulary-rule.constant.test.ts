/**
 * Stackra file contract:
 * Purpose: rule tests of `stackra/no-tenant-vocabulary`: tenant in an identifier is reported outside tenancy.
 * Boundary: test only; runs the rule through oxlint's RuleTester with the runner from @stackra/testing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing).
 */
import { describe, it } from "@stackra/testing";
import { RuleTester } from "oxlint/plugins-dev";

import { NO_TENANT_VOCABULARY_RULE } from "#core/constants/no-tenant-vocabulary-rule.constant";

RuleTester.describe = describe;
RuleTester.it = it;

const tester = new RuleTester({
  languageOptions: { sourceType: "module", parserOptions: { lang: "ts" } },
});

tester.run(
  "no-tenant-vocabulary",
  NO_TENANT_VOCABULARY_RULE as unknown as Parameters<RuleTester["run"]>[1],
  {
    valid: [
      { filename: "src/a.ts", code: "const scope: ScopeRef = ref;" },
      { filename: "src/a.ts", code: 'const label = "tenant";\n// tenant' },
      { filename: "packages/backend/tenancy/src/a.ts", code: "const tenantId = 1;" },
    ],
    invalid: [
      {
        filename: "src/a.ts",
        code: "const tenantId = 1;",
        errors: [{ messageId: "noTenant", data: { name: "tenantId" } }],
      },
      {
        filename: "src/a.ts",
        code: "export class TenantGuard {}",
        errors: [{ messageId: "noTenant", data: { name: "TenantGuard" } }],
      },
      {
        filename: "src/a.ts",
        code: "run(user.currentTenant);",
        errors: [{ messageId: "noTenant", data: { name: "currentTenant" } }],
      },
    ],
  },
);
