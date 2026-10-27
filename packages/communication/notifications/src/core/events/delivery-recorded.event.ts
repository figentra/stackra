/**
 * Stackra file contract:
 * Purpose: `DeliveryRecorded`, recorded when a transport records a delivery outcome: sent, failed (the provider refused
 *          it) or revoked (the device is gone). Its fields are a `NotificationDeliveryEvent`.
 * Boundary: an integration event (`delivery.recorded`, version 1); gen locks its wire name
 *           `notifications.delivery.recorded.v1` (the events package needs a dotted name, so the batch's
 *           `delivery_recorded` reads `delivery.recorded`). Ids and codes only, never an address or content. It
 *           registers this package's own schema when the module loads.
 * Runtime: isomorphic
 * Governing contract: ADR 0223; ADR 0086 (decision 1); ADR 0141 (2026-10-23 note); ADR 0305 (rule 19); stackra-207
 *                     (STA-1360).
 */
import { IntegrationEvent } from "@stackra/events";
import { Field, registerSchemas } from "@stackra/validation";
import { z } from "zod";

import type { NotificationChannel } from "#contracts/enums/notification-channel.enum";
import type { NotificationDeliveryEvent } from "#contracts/types/notification-delivery-event.type";
import { DELIVERY_RECORDED_SCHEMA } from "#core/constants/delivery-recorded-schema.constant";

/**
 * One delivery outcome.
 *
 * @example
 * export class DeliveryAnalyticsListener extends Listener {
 *   async handle(event: DeliveryRecorded): Promise<void> { ... }
 * }
 */
export class DeliveryRecorded
  extends IntegrationEvent({ name: "delivery.recorded" })
  implements NotificationDeliveryEvent
{
  /** Its status after this event. */
  // reason: the status codes are the `NotificationDeliveryEvent` literal union, which ships no enum and no `X$`
  @Field(z.enum(["sent", "delivered", "failed", "revoked"]))
  status!: NotificationDeliveryEvent["status"];

  /** The delivery's idempotency key. */
  deliveryId!: string;

  /** The channel it went on. */
  channel!: NotificationChannel;

  /** The provider code that carried it. */
  provider!: string;

  /** When it happened, ISO 8601. */
  at!: string;
}

registerSchemas([[DeliveryRecorded, DELIVERY_RECORDED_SCHEMA]]);
