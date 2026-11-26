/**
 * Stackra file contract:
 * Purpose: `NotificationPreferenceRow`, one topic of the notification preferences a person (or their organisation)
 *          sees: its words and, per offered channel, whether it is on and whether it is locked.
 * Boundary: a type only; what `NotificationPreferencesClient.get` answers. The words are already in the viewer's
 *           language. A locked channel is one the organisation or the law keeps on (security mail); a client never
 *           changes it.
 * Runtime: isomorphic
 * Governing contract: ADR 0260 (client ports); ADR 0223 (decision 5 as amended by ADR 0270); the UI build list client
 *                     ports note (2026-11-02).
 */
import type { NotificationChannel } from "#contracts/enums/notification-channel.enum";

/**
 * A topic and its channels.
 *
 * @example
 * const row: NotificationPreferenceRow = {
 *   topic: "orders",
 *   label: "Order updates",
 *   channels: { mail: { isEnabled: true, isLocked: false }, push: { isEnabled: false, isLocked: false } },
 * };
 */
export interface NotificationPreferenceRow {
  /** The topic's code, the notification category it stands for. */
  readonly topic: string;
  /** The topic's name, in the viewer's language. */
  readonly label: string;
  /** A line under the name, in the viewer's language. */
  readonly description?: string | undefined;
  /** Each channel the topic can use, with its state; a channel missing here is not offered for the topic. */
  readonly channels: Partial<
    Record<NotificationChannel, { readonly isEnabled: boolean; readonly isLocked: boolean }>
  >;
}
