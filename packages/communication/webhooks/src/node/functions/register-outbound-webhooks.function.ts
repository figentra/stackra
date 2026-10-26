/**
 * Stackra file contract:
 * Purpose: `registerOutboundWebhooks`, how gen's entry names the integration events that may leave as outbound webhooks
 *          with their locked wire names and, for a gated one, the entitlement a subscriber needs, and subscribes
 *          `SendWebhooksListener` to each.
 * Boundary: writes `OUTBOUND_EVENTS`, `OUTBOUND_EVENT_ENTITLEMENTS` and the listener registry of @stackra/events after
 *           checking each row: an integration event declared `webhook: true`, a wire name and, when given, a non-blank
 *           entitlement key. Registering a row again changes nothing.
 * Runtime: node
 * Governing contract: ADR 0224 (decision 1); ADR 0141 (wire names, locked in the manifest); ADR 0294 (decisions 4, 20
 *                     and 22); ADR 0422 (decision 4).
 */
import { kindOf } from "@stackra/container";
import { registerListeners } from "@stackra/events";
import type { EventClass } from "@stackra/events";

import { OUTBOUND_EVENT_ENTITLEMENTS } from "#node/constants/outbound-event-entitlements.constant";
import { OUTBOUND_EVENTS } from "#node/constants/outbound-events.constant";
import { SendWebhooksListener } from "#node/listeners/send-webhooks.listener";

/**
 * Registers the outbound webhook events.
 *
 * @throws TypeError when a class is not an integration event with `webhook: true`, its wire name is empty, or its
 *         entitlement is blank.
 * @example
 * registerOutboundWebhooks([
 *   { type: OrderPaid, name: "orders.order.paid.v1" },
 *   { type: AuditRecordAppended, name: "records.audit_record.appended.v1", entitlement: "records.audit_evidence" },
 * ]);
 */
export function registerOutboundWebhooks(
  rows: readonly {
    readonly type: EventClass;
    readonly name: string;
    readonly entitlement?: string;
  }[],
): void {
  for (const { type, name, entitlement } of rows) {
    const record = kindOf(type);
    if (record?.kind !== "integration_event" || record.options["webhook"] !== true)
      throw new TypeError(
        `${type.name} is not an integration event with webhook: true, so it never leaves as a webhook`,
      );
    if (typeof name !== "string" || name === "")
      throw new TypeError(`${type.name} needs its locked wire name`);
    if (entitlement !== undefined && entitlement.trim() === "")
      throw new TypeError(
        `${type.name} names a blank entitlement; leave it out for an ungated event`,
      );
    OUTBOUND_EVENTS.set(type, name);
    if (entitlement !== undefined) OUTBOUND_EVENT_ENTITLEMENTS.set(name, entitlement);
  }
  registerListeners(rows.map(({ type }) => [type, SendWebhooksListener] as const));
}
