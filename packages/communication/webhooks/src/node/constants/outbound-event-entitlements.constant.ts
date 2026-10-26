/**
 * Stackra file contract:
 * Purpose: `OUTBOUND_EVENT_ENTITLEMENTS`, the outbound webhook events a plan gates: each wire name with the
 *          entitlement a scope node needs to subscribe an endpoint to it (`records.audit_record.appended.v1` to
 *          `records.audit_evidence`).
 * Boundary: process-wide and internal: written by `registerOutboundWebhooks` from a row's `entitlement` (gen's entry,
 *           from the manifest), read by `WebhookEndpointService` on register and on fan-out. An event not here is
 *           ungated.
 * Runtime: node
 * Governing contract: ADR 0224 (decision 1); ADR 0422 (decision 4).
 */

/** Wire name to the entitlement that unlocks it. */
export const OUTBOUND_EVENT_ENTITLEMENTS = new Map<string, string>();
