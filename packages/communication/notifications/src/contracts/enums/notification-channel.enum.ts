/**
 * Stackra file contract:
 * Purpose: `NotificationChannel`, the channels a notification is delivered on: mail, SMS, WhatsApp, push, in-app, chat
 *          and voice.
 * Boundary: an `Enum.of` value plus the type of the same name. Products declare channels, never providers (ADR 0223
 *           decision 2); the provider behind a channel is chosen per tenant and Market (ADR 0356). WhatsApp is its own
 *           channel, not a kind of SMS (ADR 0355 decision 4).
 * Runtime: isomorphic
 * Governing contract: ADR 0223 (decisions 1 and 2); ADR 0355 (decisions 1 and 4); ADR 0231.
 */
import { Enum } from "@stackra/contracts";

/**
 * The channels.
 *
 * @example
 * const order = settings.notifications.channelOrder; // ["whatsapp", "sms", "mail"], from data
 */
export const NotificationChannel = Enum.of({
  /** Email. */
  Mail: "mail",
  /** Text messages. */
  Sms: "sms",
  /** WhatsApp Business messages. */
  WhatsApp: "whatsapp",
  /** Mobile (Expo) and web (VAPID) push. */
  Push: "push",
  /** The person's in-app inbox. */
  InApp: "in_app",
  /** Chat apps (Slack, Teams, Telegram). */
  Chat: "chat",
  /** Phone calls. */
  Voice: "voice",
});

/** One of the codes above. */
export type NotificationChannel = Enum.Value<typeof NotificationChannel>;
