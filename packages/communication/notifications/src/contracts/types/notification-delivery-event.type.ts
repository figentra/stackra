/**
 * Stackra file contract:
 * Purpose: `NotificationDeliveryEvent`, one state change of one delivery: which delivery, on which channel and provider,
 *          its new status (`sent`, `delivered`, `failed` or `revoked`) and when. The payload of the
 *          `notifications.delivery.recorded.v1` integration event and the input of delivery analytics (the Pro
 *          notifications studio reads it).
 * Boundary: a type only. Ids and codes, never an address, a phone number or content (ADR 0134): `deliveryId` is the
 *           delivery's idempotency key (one message to one recipient on one channel); later events of the same id
 *           supersede earlier ones.
 * Runtime: isomorphic
 * Governing contract: ADR 0223; ADR 0086 (decision 1: delivery tracking); ADR 0134; stackra-207 (STA-1360).
 */
import type { NotificationChannel } from "#contracts/enums/notification-channel.enum";

/** A delivery's state change. */
export interface NotificationDeliveryEvent {
  /** The delivery's id: its idempotency key. */
  readonly deliveryId: string;

  /** The channel it went on. */
  readonly channel: NotificationChannel;

  /** The provider that carried it: the Integration's provider code (`resend`, `twilio`, `expo`, `web-push`). */
  readonly provider: string;

  /** Its status after this event. */
  readonly status: "sent" | "delivered" | "failed" | "revoked";

  /** When it happened, ISO 8601. */
  readonly at: string;
}
