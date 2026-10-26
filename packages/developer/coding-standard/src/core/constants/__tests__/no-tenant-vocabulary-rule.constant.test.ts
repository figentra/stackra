/**
 * Stackra file contract:
 * Purpose: rule tests of `stackra/no-tenant-vocabulary`: a declaration that says tenant is reported outside tenancy and
 *          the IAM scope code; imports and uses of tenancy's names (such as `BelongsToTenantMacro`) are not.
 * Boundary: test only; runs the rule through oxlint's RuleTester with the runner from @stackra/testing.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0323 (decisions 1, 5).
 */
import { describe, it } from "@stackra/testing";
import { RuleTester } from "oxlint/plugins-dev";

import { NO_TENANT_VOCABULARY_RULE } from "#core/constants/no-tenant-vocabulary-rule.constant";

RuleTester.describe = describe;
RuleTester.it = it;

const tester = new RuleTester({
  languageOptions: { sourceType: "module", parserOptions: { lang: "ts" } },
});

const SRC = "packages/commerce/loyalty-kit/src/a.ts";

/** One refused declaration: the code and the name the finding cites. */
function refused(code: string, name: string, filename = SRC) {
  return { filename, code, errors: [{ messageId: "noTenant", data: { name } }] };
}

tester.run(
  "no-tenant-vocabulary",
  NO_TENANT_VOCABULARY_RULE as unknown as Parameters<RuleTester["run"]>[1],
  {
    valid: [
      { filename: SRC, code: "const scope: ScopeRef = ref;" },
      { filename: SRC, code: 'const label = "tenant";\n// tenant\n/** tenant */ const a = 1;' },
      // The false positive of the first baseline: import and use of a name tenancy exports.
      {
        filename: SRC,
        code: [
          'import { BelongsToTenantMacro } from "@stackra/tenancy/node";',
          "compileMigration(M, { macros: [BelongsToTenantMacro] });",
        ].join("\n"),
      },
      { filename: SRC, code: 'import BelongsToTenant from "@stackra/tenancy";' },
      { filename: SRC, code: 'import * as tenantKit from "@stackra/tenancy";' },
      { filename: SRC, code: 'import { BelongsToTenant as Owned } from "@stackra/tenancy";' },
      { filename: SRC, code: 'export { BelongsToTenant } from "@stackra/tenancy";' },
      {
        filename: SRC,
        code: 'import { BelongsToTenant } from "@stackra/tenancy";\nexport { BelongsToTenant };',
      },
      { filename: SRC, code: "@BelongsToTenant()\nclass Account {}" },
      { filename: SRC, code: "class Account extends BelongsToTenant(Base) {}" },
      { filename: SRC, code: "const level = TenancyScopes.Tenant;" },
      { filename: SRC, code: "run(user.currentTenant, ctx.tenantId);" },
      { filename: SRC, code: "const scope: TenantScope = resolve();" },
      { filename: SRC, code: "type Owned = Pick<TenantRow, 'id'>;" },
      { filename: SRC, code: "const { tenantId: scopeId } = ctx;" },
      { filename: SRC, code: "create({ tenantId: scope.id });" },
      { filename: SRC, code: 'const subject = Other.of({ Tenant: "tenant" });' },
      { filename: SRC, code: "const obj = { [tenantKey]: 1 };" },
      { filename: SRC, code: "class A { [tenantKey] = 1; }" },
      // Exempt paths.
      { filename: "packages/security/tenancy/src/a.ts", code: "export class TenantGuard {}" },
      { filename: "packages/security/tenancy/src/tenant-context.ts", code: "const tenantId = 1;" },
      {
        filename: "packages/security/iam/src/core/drivers/iam-granted-scopes.driver.ts",
        code: "const tenantId = 1;",
      },
      {
        filename: "packages/security/iam/src/core/scope/resolve.ts",
        code: "function resolveTenant() {}",
      },
      {
        filename: "apps/console/.stackra/generated/tenants.ts",
        code: "export const tenantIds = [];",
      },
      {
        filename: "packages/foundation/i18n/lang/en/tenant.ts",
        code: "export const tenantLabel = 'x';",
      },
      { filename: "apps/docs/src/a.ts", code: "const tenantId = 1;" },
    ],
    invalid: [
      refused("export class TenantGuard {}", "TenantGuard"),
      refused("const Kit = class TenantKit {};", "TenantKit"),
      refused("interface TenantRow { id: string }", "TenantRow"),
      refused("type TenantId = string;", "TenantId"),
      refused("enum Level { Tenant, Branch }", "Tenant"),
      refused("enum TenantLevel { Root }", "TenantLevel"),
      refused('export const Subject = Enum.of({ Buyer: "buyer", Tenant: "tenant" });', "Tenant"),
      refused("function resolveTenant() {}", "resolveTenant"),
      refused("declare function loadTenant(): void;", "loadTenant"),
      refused("const tenantId = 1;", "tenantId"),
      refused("let currentTenant;", "currentTenant"),
      refused("const { tenantId } = ctx;", "tenantId"),
      refused("const { id: tenantId } = ctx;", "tenantId"),
      refused("const { tenantId = 1 } = ctx;", "tenantId"),
      refused("const [tenant] = list;", "tenant"),
      refused("const { ...tenantRest } = ctx;", "tenantRest"),
      refused("function f(tenant: Ref) {}", "tenant"),
      refused("const f = (tenantId = 1) => tenantId;", "tenantId"),
      refused("type F = (tenantId: string) => void;", "tenantId"),
      refused("class A { constructor(private readonly tenantId: string) {} }", "tenantId"),
      refused("class A { tenantId = 1; }", "tenantId"),
      refused("class A { accessor tenantId = 1; }", "tenantId"),
      refused("class A { findTenant() {} }", "findTenant"),
      refused("class A { get tenant() { return 1; } }", "tenant"),
      refused("abstract class A { abstract tenantId: string; }", "tenantId"),
      {
        filename: SRC,
        code: "interface A { tenantId: string; findTenant(): void }",
        errors: [
          { messageId: "noTenant", data: { name: "tenantId" } },
          { messageId: "noTenant", data: { name: "findTenant" } },
        ],
      },
      refused(
        "const a = 1;",
        "tenant-context.ts",
        "packages/commerce/loyalty-kit/src/tenant-context.ts",
      ),
      // A tenancy-named folder outside the packages tree is not the tenancy package.
      refused("const tenantId = 1;", "tenantId", "apps/console/src/tenancy/a.ts"),
      // IAM code that is not its scope code is not exempt.
      refused(
        "const tenantId = 1;",
        "tenantId",
        "packages/security/iam/src/core/drivers/store-policy-source.driver.ts",
      ),
    ],
  },
);
