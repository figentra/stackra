/**
 * Stackra file contract:
 * Purpose: `PUBLIC_ID_PREFIXES`, the shared registry of public id prefixes (ADR 0135 rule 2): each prefix the
 *          platform packages mint, with the identity that owns it, a model key for a model's `HasPublicId(prefix)` and
 *          `<member>.<thing>` for an id a runtime package mints without a model. Read from the models and the
 *          `PublicId<"x">` types of the packages on 2026-10-25.
 * Boundary: a frozen map, prefix to owner. Gen refuses a model whose prefix this registry gives to another owner
 *           (`prefix_taken`); a prefix the registry does not list belongs to the member that declares it. Adding a
 *           platform prefix is a reviewed change to this file.
 * Runtime: isomorphic
 * Governing contract: ADR 0135 (rule 2 and its consequences: the registry is a shared file in gen); ADR 0294
 *                     (decision 20: model keys).
 */

/** Prefix to the identity that owns it. */
export const PUBLIC_ID_PREFIXES: Readonly<Record<string, string>> = Object.freeze({
  acl: "access_log.access_log_entry",
  cfd: "content.custom_field",
  cfv: "content.custom_field_value_set",
  conn: "integrations.connection",
  evt: "outbox.event",
  job: "queue.job",
  lac: "loyalty_kit.loyalty_account",
  lpe: "loyalty_kit.ledger_entry",
  rev: "content.revision",
  rset: "rules.rule_set",
  sch: "scheduler.schedule",
  scp: "scope.scope_node",
  seg: "segments.segment",
  sgm: "segments.segment_membership",
  sqb: "database.sequence_block",
  sst: "settings.stored_setting",
  upl: "media.upload",
  usr: "identity.user",
  wfa: "workflow.automation",
  wfc: "workflow.checklist",
  wfk: "workflow.service_ack_set",
  wfp: "workflow.checklist_progress",
  wfr: "workflow.run",
  wfs: "workflow.signal",
  whd: "webhooks.webhook_delivery",
  whe: "webhooks.webhook_endpoint",
});
