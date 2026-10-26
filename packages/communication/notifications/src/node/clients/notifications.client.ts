/**
 * Stackra file contract:
 * Purpose: `NotificationsClient`, this package's client of the service a `NotifierTarget` names: its `send` member over
 *          the target's action, which the `notifications` Notifier driver queues each message through.
 * Boundary: internal to `./node`; built by the driver over the injected `ClientTransport`, so topology picks the
 *           transport as for every generated client. Input validation and the wire form are `ServiceClient`'s, so a
 *           mapper's payload that breaks the target action's input is refused before it is queued.
 * Runtime: node
 * Governing contract: ADR 0260 (decisions 3, 4 and 6); ADR 0422 (decision 1).
 */
import { ServiceClient } from "@stackra/clients";
import type { ActionMember, ActionRef } from "@stackra/clients";
import type { ClientTransport } from "@stackra/clients/contracts";

/**
 * The target service, as a producer of notifications sees it.
 *
 * @example
 * await new NotificationsClient(transport, SEND_MESSAGE_ACTION).send.queue({ mail, to, subject, html, text });
 */
export class NotificationsClient<A extends ActionRef = ActionRef> extends ServiceClient {
  /** The target action. */
  readonly send: ActionMember<A>;

  /**
   * @param transport - the transport topology picked for calls to the target service.
   * @param action - the target action.
   */
  constructor(transport: ClientTransport, action: A) {
    super(transport);
    this.send = this.member(action);
  }
}
