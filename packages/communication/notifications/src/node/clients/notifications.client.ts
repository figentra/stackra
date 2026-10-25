/**
 * Stackra file contract:
 * Purpose: `NotificationsClient`, this package's client of the notifications service: its `message.send` member, which
 *          the `notifications` Notifier driver queues each rendered mail through.
 * Boundary: internal to `./node`; built by the driver over the injected `ClientTransport`, so topology picks the
 *           transport as for every generated client. Input validation and the wire form are `ServiceClient`'s.
 * Runtime: node
 * Governing contract: ADR 0260 (decisions 3, 4 and 6).
 */
import { ServiceClient } from "@stackra/clients";

import { SEND_MESSAGE_ACTION } from "#node/constants/send-message-action.constant";

/**
 * The notifications service, as a producer of mail sees it.
 *
 * @example
 * await new NotificationsClient(transport).message.send.queue({ mail, to, subject, html, text });
 */
export class NotificationsClient extends ServiceClient {
  /** The `message` resource. */
  readonly message = { send: this.member(SEND_MESSAGE_ACTION) };
}
