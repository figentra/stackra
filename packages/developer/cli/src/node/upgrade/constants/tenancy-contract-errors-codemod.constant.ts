/**
 * Stackra file contract:
 * Purpose: `TENANCY_CONTRACT_ERRORS_CODEMOD`, 0.30.0: a table or model without its tenancy fails the row-security
 *          audit and gen.
 * Boundary: data only.
 * Runtime: node
 * Governing contract: ADR 0199 (decision 2); ADR 0013 (decision 5); STA-145; changeset 15dba8d.
 */
import type { UpgradeCodemod } from "#node/upgrade/types/upgrade-codemod.type";

/** A table or model without its tenancy is an error. */
export const TENANCY_CONTRACT_ERRORS_CODEMOD: UpgradeCodemod = {
  id: "tenancy-contract-errors",
  version: "0.30.0",
  title: "A table or model without its tenancy is an error",
  note: "assertRowSecurity fails a table without the owner column that no platform list names, and gen's model_tenancy_missing and model_tenancy_migration_missing are errors for a package's models. Before taking this version, list each table that holds no tenant data with t.platformTable(reason) (or t.reviewedPolicy(reason, policies)), give each tenant table its owner column, and mark each model BelongsToTenant, BelongsToTenantOrPlatform or Model.global.",
  source: "15dba8d, ADR 0239",
};
