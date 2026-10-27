/**
 * Stackra file contract:
 * Purpose: `NotificationsClient`, this package's client of the service a `NotifierTarget` names: `send(action)` is the
 *          member over the target's action, which the `notifications` Notifier driver queues each message through.
 * Boundary: internal to `./node`; built by the driver over the injected `ClientTransport`, so topology picks the
 *           transport as for every generated client. The constructor takes the transport only (a class token, ADR 0294
 *           rule 17); the action is passed to `send`. Input validation and the wire form are `ServiceClient`'s, so a
 *           mapper's payload that breaks the target action's input is refused before it is queued.
 * Runtime: node
 * Governing contract: ADR 0260 (decisions 3, 4 and 6); ADR 0422 (decision 1).
 */
import { ServiceClient } from "@stackra/clients";
import type { ActionMember, ActionRef } from "@stackra/clients";

/**
 * The target service, as a producer of notifications sees it.
 *
 * @example
 * await new NotificationsClient(transport).send(SEND_MESSAGE_ACTION).queue({ mail, to, subject, html, text });
 */
export class NotificationsClient extends ServiceClient {
  /**
   * The member that calls and queues `action`.
   * @param action - the target action.
   */
  send<A extends ActionRef>(action: A): ActionMember<A> {
    return this.member(action);
  }
}
