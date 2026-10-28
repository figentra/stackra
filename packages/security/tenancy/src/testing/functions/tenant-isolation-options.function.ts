/**
 * Stackra file contract:
 * Purpose: `tenantIsolationOptions`, the tenant form of `@stackra/database/testing`'s `assertRowSecurity` options:
 *          the `tenant_id` column the `BelongsToTenant` macro writes, the `app.tenant_id` setting its policy reads, the
 *          service role and two fresh tenant ids for the probe. A service's generated isolation test passes it:
 *          `await assertRowSecurity(postgres.database, tenantIsolationOptions())`.
 * Boundary: data only; it imports no other package's `./testing` (ADR 0269 decision 3), so the generated test joins
 *           the two. The role name is the caller's to change.
 * Runtime: node
 * Governing contract: ADR 0239 (decision 1); ADR 0327 (decision 8); `.agents/rules/tenancy.md` (point 2).
 */
import type { PublicId } from "@stackra/contracts";

import { TENANT_ID_SETTING } from "#node/constants/tenant-id-setting.constant";
import { fakeTenantId } from "#testing/functions/fake-tenant-id.function";

/**
 * The tenant row-security options, with two new tenant ids.
 *
 * @param role - the role the service connects as; `stackra_app` by default.
 * @example
 * await assertRowSecurity(postgres.database, tenantIsolationOptions());
 */
export function tenantIsolationOptions(role = "stackra_app"): {
  readonly column: "tenant_id";
  readonly setting: typeof TENANT_ID_SETTING;
  readonly role: string;
  readonly probe: readonly [PublicId<"scp">, PublicId<"scp">];
} {
  return {
    column: "tenant_id",
    setting: TENANT_ID_SETTING,
    role,
    probe: [fakeTenantId(), fakeTenantId()],
  };
}
