/**
 * Stackra file contract:
 * Purpose: `GEN_INVARIANT_PLURALS_CODEMOD`, 0.31.0: a model whose last word is already plural keeps it in its derived
 *          table name and resource path.
 * Boundary: data only.
 * Runtime: node
 * Governing contract: ADR 0199 (decision 2); ADR 0013 (decision 5); STA-145; changeset 73ea174.
 */
import type { UpgradeCodemod } from "#node/upgrade/types/upgrade-codemod.type";

/** An already plural model name keeps its plural in the table name and resource path. */
export const GEN_INVARIANT_PLURALS_CODEMOD: UpgradeCodemod = {
  id: "gen-invariant-plurals",
  version: "0.31.0",
  title: "An already plural model name keeps its plural in the table name and resource path",
  note: "OpeningHours is opening_hours, no longer opening_hourses; the same holds for news, series, settings, analytics, species, preferences and the rest of INVARIANT_PLURALS. A table a migration created under the old name needs a migration that renames it before stackra db diff is clean, and a caller that wrote the old resource path by hand follows the new one (generated clients follow when stackra gen runs).",
  source: "73ea174",
};
