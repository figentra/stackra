/**
 * Stackra file contract:
 * Purpose: `DATABASE_SEED_PACK_STATUS_CODEMOD`, 0.4.0: the member console command `db:seed` is renamed
 *          `seed-pack:status`.
 * Boundary: data only.
 * Runtime: node
 * Governing contract: ADR 0199 (decision 2); ADR 0013 (decision 5); STA-145; changeset 3df2c07.
 */
import type { UpgradeCodemod } from "#node/upgrade/types/upgrade-codemod.type";

/** The console command db:seed is seed-pack:status. */
export const DATABASE_SEED_PACK_STATUS_CODEMOD: UpgradeCodemod = {
  id: "database-seed-pack-status",
  version: "0.4.0",
  title: "The console command db:seed is seed-pack:status",
  note: "The member console command db:seed is renamed seed-pack:status (it reports a seed pack's stored records); stackra db seed is the command that runs seeders. Change a script or runbook that called db:seed.",
  source: "3df2c07, STA-1852",
};
