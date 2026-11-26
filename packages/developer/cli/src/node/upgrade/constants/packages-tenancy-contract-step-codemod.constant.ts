/**
 * Stackra file contract:
 * Purpose: `PACKAGES_TENANCY_CONTRACT_STEP_CODEMOD`, 0.23.0: the package tables of the expand step make `tenant_id`
 *          NOT NULL.
 * Boundary: data only.
 * Runtime: node
 * Governing contract: ADR 0199 (decision 2); ADR 0013 (decision 5); STA-145; changeset 12f4836.
 */
import type { UpgradeCodemod } from "#node/upgrade/types/upgrade-codemod.type";

/** Package tables make tenant_id NOT NULL. */
export const PACKAGES_TENANCY_CONTRACT_STEP_CODEMOD: UpgradeCodemod = {
  id: "packages-tenancy-contract-step",
  version: "0.23.0",
  title: "Package tables make tenant_id NOT NULL",
  note: "Migrations achievements.0004, rules.0005, segments.0003, content.0006, collaboration.0004 and workflow.0011 make tenant_id NOT NULL. Each refuses, changing nothing, while a table holds a row with no tenant: run the tenant backfill first, then migrate again. After it these tables are written only inside a tenant call.",
  source: "12f4836",
};
