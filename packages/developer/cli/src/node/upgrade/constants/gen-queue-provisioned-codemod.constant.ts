/**
 * Stackra file contract:
 * Purpose: `GEN_QUEUE_PROVISIONED_CODEMOD`, 0.4.0: a named job queue must be declared under every environment of the
 *          service's runway.yaml.
 * Boundary: data only.
 * Runtime: node
 * Governing contract: ADR 0199 (decision 2); ADR 0013 (decision 5); STA-145; changeset 13b7dff.
 */
import type { UpgradeCodemod } from "#node/upgrade/types/upgrade-codemod.type";

/** gen refuses a job queue an environment's runway.yaml does not provision. */
export const GEN_QUEUE_PROVISIONED_CODEMOD: UpgradeCodemod = {
  id: "gen-queue-provisioned",
  version: "0.4.0",
  title: "gen refuses a job queue an environment's runway.yaml does not provision",
  note: "A service's full gen run refuses queue_unprovisioned when an environment in its runway.yaml has no queues.<name> entry for a queue its job actions run on (default aside). Before stackra gen passes, add each named queue under every environment the service's runway.yaml declares, dev and preview included (environments.dev.queues.invoices.visibilityTimeoutSeconds: 300).",
  source: "13b7dff, STA-1727",
};
