/**
 * Stackra file contract:
 * Purpose: `TENANCY_MEMORY_TIER_ISOLATION_CODEMOD`, 0.23.0: memory-tier tests run each action in its actor's tenant.
 * Boundary: data only.
 * Runtime: node
 * Governing contract: ADR 0199 (decision 2); ADR 0013 (decision 5); STA-145; changeset 1083617.
 */
import type { UpgradeCodemod } from "#node/upgrade/types/upgrade-codemod.type";

/** Memory-tier tests run each action in its actor's tenant. */
export const TENANCY_MEMORY_TIER_ISOLATION_CODEMOD: UpgradeCodemod = {
  id: "tenancy-memory-tier-isolation",
  version: "0.23.0",
  title: "Memory-tier tests run each action in its actor's tenant",
  note: "Under createTestingModule(...).useDrivers(\"memory\") an action runs in its actor's tenant, as production does. Arrange each tenant's rows inside runAsTenant(thatTenant, ...); call run(Action, input, { as: actor }) outside any runAsTenant or inside the actor's own tenant (another tenant's actor is refused with TenantSwitchRefusedError); call drainOutbox() outside runAsTenant.",
  source: "1083617",
};
