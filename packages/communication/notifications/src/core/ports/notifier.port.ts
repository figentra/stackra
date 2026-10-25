/**
 * Stackra file contract:
 * Purpose: the `Notifier` port: sends one notification for one event to every recipient it names, on every channel it
 *          declares. Config `notifications.driver` picks the driver (`memory` today).
 * Boundary: an abstract class that is its own token. Gen's generated listener calls `notify` once per event id, on
 *           the notifications queue after commit, with the notification instance the container built; a driver never
 *           reads preferences (the notifications service owns them, ADR 0223 as amended by ADR 0270). Exported from
 *           `.` because its signature is the kind's, and a consumer reads the bound driver with `app.get(Notifier)`.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 4, 16 and 17); ADR 0223; ADR 0266 (one option, one driver, memory first).
 */
import { Port } from "@stackra/contracts";

import type { Notification } from "#core/bases/notification.base";

/**
 * Sends notifications.
 *
 * @example
 * // what gen's listener for OrderPaid does
 * await notifier.notify(receipt, event);
 */
export abstract class Notifier extends Port {
  /**
   * Prepares `notification` for `event` (recipients, data, channel messages) and hands each recipient's delivery to
   * its channels.
   *
   * @throws TypeError when the class does not extend `Notification({ category })`, a recipient is not a `Recipient`,
   *         or `mail()` sets no subject.
   */
  abstract notify(notification: Notification, event: object): Promise<void>;
}
