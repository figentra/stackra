/**
 * Stackra file contract:
 * Purpose: `INTEGRATIONS_PEER_CODEMOD`, 0.22.0: `@stackra/integrations` becomes a peer, which each member must
 *          install.
 * Boundary: data only.
 * Runtime: node
 * Governing contract: ADR 0199 (decision 2); ADR 0013 (decision 5); STA-145; changeset 3a9a6be.
 */
import type { UpgradeCodemod } from "#node/upgrade/types/upgrade-codemod.type";

/** `@stackra/integrations` is a peer of the libraries that use it. */
export const INTEGRATIONS_PEER_CODEMOD: UpgradeCodemod = {
  id: "integrations-peer",
  version: "0.22.0",
  title: "@stackra/integrations is a peer of the libraries that use it",
  note: "Payments, webhooks, documents, notifications, pricing, achievements and loyalty-kit take @stackra/integrations as a peer, so a product resolves one copy. Add @stackra/integrations to the dependencies of every member that depends on one of them; stackra validate refuses the mistake (hosted-peers).",
  source: "3a9a6be",
};
