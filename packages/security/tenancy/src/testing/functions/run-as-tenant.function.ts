/**
 * Stackra file contract:
 * Purpose: `runAsTenant(tenantId, work)`, runs `work` as `tenantId` without a database, so a model factory or
 *          `new Model()` fills `BelongsToTenant` (and `BelongsToTenantOrPlatform`) with that tenant in a unit test.
 * Boundary: test helper over the internal tenant storage, the application half of `withTenant` only: no transaction
 *           and no `app.tenant_id`, so it proves nothing about row isolation (an isolation test runs `withTenant` on a
 *           database). `undefined` runs `work` as a platform call.
 * Runtime: node
 * Governing contract: ADR 0269 (testing entries); ADR 0239; OS audit SPEC gap 11.
 */
import type { PublicId } from "@stackra/contracts";

import { ACTIVE_TENANT } from "#node/constants/active-tenant.constant";

/**
 * Runs `work` in `tenantId`'s tenant call.
 *
 * @example
 * const order = runAsTenant(tenantId, () => new Order()); // order.tenantId === tenantId
 */
export function runAsTenant<T>(tenantId: PublicId<"scp"> | undefined, work: () => T): T {
  return ACTIVE_TENANT.run(tenantId, work);
}
