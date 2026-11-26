/**
 * Stackra file contract:
 * Purpose: `SETTINGS_ROW_OWNERS_CODEMOD`, 0.30.0: the settings tables become tenant-owned.
 * Boundary: data only.
 * Runtime: node
 * Governing contract: ADR 0199 (decision 2); ADR 0013 (decision 5); STA-145; changeset 11def65.
 */
import type { UpgradeCodemod } from "#node/upgrade/types/upgrade-codemod.type";

/** The settings tables are tenant-owned. */
export const SETTINGS_ROW_OWNERS_CODEMOD: UpgradeCodemod = {
  id: "settings-row-owners",
  version: "0.30.0",
  title: "The settings tables are tenant-owned",
  note: "settings.0004 refuses while a setting or revision sits below a tenant node or belongs to a user: record those values, delete the rows (nlevel(scope_path) > 3, or user_id is not null) from both tables, migrate, then write the values again from a session in each node's or user's tenant. StoredSetting and StoredSettingRevision are BelongsToTenantOrPlatform, and @stackra/settings depends on @stackra/tenancy.",
  source: "11def65, c8e7592",
};
