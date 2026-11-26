/**
 * Stackra file contract:
 * Purpose: `WEBHOOKS_ROW_OWNERS_CODEMOD`, 0.25.0: webhook endpoints and deliveries become tenant-owned.
 * Boundary: data only.
 * Runtime: node
 * Governing contract: ADR 0199 (decision 2); ADR 0013 (decision 5); STA-145; changeset 3942ab1.
 */
import type { UpgradeCodemod } from "#node/upgrade/types/upgrade-codemod.type";

/** Webhook endpoints and deliveries belong to a tenant. */
export const WEBHOOKS_ROW_OWNERS_CODEMOD: UpgradeCodemod = {
  id: "webhooks-row-owners",
  version: "0.25.0",
  title: "Webhook endpoints and deliveries belong to a tenant",
  note: "Migration webhooks.0003 gives webhook_endpoints and webhook_deliveries a required tenant_id under row-level security, backfilled from each endpoint's top-level tenant node. It refuses while an endpoint sits at the root, at a product or below a tenant: delete or re-register those endpoints, then migrate again. Every read and write of these tables runs in a tenant call.",
  source: "3942ab1",
};
