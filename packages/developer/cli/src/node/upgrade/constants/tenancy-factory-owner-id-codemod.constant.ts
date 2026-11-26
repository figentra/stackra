/**
 * Stackra file contract:
 * Purpose: `TENANCY_FACTORY_OWNER_ID_CODEMOD`, 0.22.0: `runAsTenant` refuses a test row saved with another
 *          `tenantId`.
 * Boundary: data only.
 * Runtime: node
 * Governing contract: ADR 0199 (decision 2); ADR 0013 (decision 5); STA-145; changeset 227dd7a.
 */
import type { UpgradeCodemod } from "#node/upgrade/types/upgrade-codemod.type";

/** runAsTenant refuses a row saved with another tenantId. */
export const TENANCY_FACTORY_OWNER_ID_CODEMOD: UpgradeCodemod = {
  id: "tenancy-factory-owner-id",
  version: "0.22.0",
  title: "runAsTenant refuses a row saved with another tenantId",
  note: "runAsTenant(T, work) refuses a new BelongsToTenant row saved with a tenantId other than T (a factory definition(), create({ tenantId }) or a direct insert). Remove tenantId from each model factory's definition() and create another tenant's rows in runAsTenant(B, ...). Production is unchanged: the check lives in ./testing.",
  source: "227dd7a",
};
