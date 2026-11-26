/**
 * Stackra file contract:
 * Purpose: `SEARCH_PRIVACY_ROW_OWNERS_CODEMOD`, 0.30.0: the search index registry and the privacy tables become
 *          tenant-owned.
 * Boundary: data only.
 * Runtime: node
 * Governing contract: ADR 0199 (decision 2); ADR 0013 (decision 5); STA-145; changeset 265a3ee.
 */
import type { UpgradeCodemod } from "#node/upgrade/types/upgrade-codemod.type";

/** The search index registry and the privacy tables are tenant-owned. */
export const SEARCH_PRIVACY_ROW_OWNERS_CODEMOD: UpgradeCodemod = {
  id: "search-privacy-row-owners",
  version: "0.30.0",
  title: "The search index registry and the privacy tables are tenant-owned",
  note: "search.0010 refuses while an index registry row sits below a tenant node: delete those rows (they hold only a rebuild's state), migrate, then run search:reindex in each node's tenant. privacy.0003 copies each scope_id partition into tenant_id. PostgresHoldRegistryDriver takes the Container as its second argument: a host that builds it by hand passes it.",
  source: "265a3ee",
};
