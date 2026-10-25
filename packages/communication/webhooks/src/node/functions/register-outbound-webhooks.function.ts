/**
 * Stackra file contract:
 * Purpose: `registerOutboundWebhooks`, how gen's entry names the integration events that may leave as outbound webhooks
 *          with their locked wire names, and subscribes `SendWebhooksListener` to each.
 * Boundary: writes `OUTBOUND_EVENTS` and the listener registry of @stackra/events after checking each row: an
 *           integration event declared `webhook: true` and a wire name. Registering a row again changes nothing.
 * Runtime: node
 * Governing contract: ADR 0224 (decision 1); ADR 0141 (wire names, locked in the manifest); ADR 0294 (decisions 4, 20
 *                     and 22).
 */
import { kindOf } from "@stackra/container";
import { registerListeners } from "@stackra/events";
import type { EventClass } from "@stackra/events";

import { OUTBOUND_EVENTS } from "#node/constants/outbound-events.constant";
import { SendWebhooksListener } from "#node/listeners/send-webhooks.listener";

/**
 * Registers the outbound webhook events.
 *
 * @throws TypeError when a class is not an integration event with `webhook: true`, or its wire name is empty.
 * @example
 * registerOutboundWebhooks([{ type: OrderPaid, name: "orders.order.paid.v1" }]);
 */
export function registerOutboundWebhooks(
  rows: readonly { readonly type: EventClass; readonly name: string }[],
): void {
  for (const { type, name } of rows) {
    const record = kindOf(type);
    if (record?.kind !== "integration_event" || record.options["webhook"] !== true)
      throw new TypeError(
        `${type.name} is not an integration event with webhook: true, so it never leaves as a webhook`,
      );
    if (typeof name !== "string" || name === "")
      throw new TypeError(`${type.name} needs its locked wire name`);
    OUTBOUND_EVENTS.set(type, name);
  }
  registerListeners(rows.map(({ type }) => [type, SendWebhooksListener] as const));
}
