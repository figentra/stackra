/**
 * Stackra file contract:
 * Purpose: `NotifierTarget`, where the `notifications` Notifier driver queues each message: the remote action (any
 *          service's, `crm.notice.send@1` as well as `messages.message.send@1`) and the mapper that turns one
 *          `NotifierMessage` into that action's input.
 * Boundary: a type only. The mapper is pure and answers `null` to skip a message the target does not take (a
 *           mail-only target and a notification without mail). The action's own input schema validates what the mapper
 *           answers before anything is queued. `addressPayload` maps a message for a mail address with no account
 *           (`Recipient.address`); a target without it takes principals only, and the driver refuses an address
 *           recipient before anything is queued.
 * Runtime: node
 * Governing contract: ADR 0260 (decisions 3 and 4); ADR 0422 (decision 1, as amended by STA-1235).
 */
import type { ActionRef, RefInput } from "@stackra/clients";

import type { NotifierAddressMessage } from "#node/types/notifier-address-message.type";
import type { NotifierMessage } from "#node/types/notifier-message.type";

/** A target action and its payload mapper. */
export interface NotifierTarget<A extends ActionRef = ActionRef> {
  /** The remote action queued once per principal. */
  readonly action: A;

  /** The action's input for `message`, or `null` to queue nothing for it. */
  readonly payload: (message: NotifierMessage) => RefInput<A> | null;

  /** The action's input for a message to a mail address, or `null` to skip it; absent when the target cannot. */
  readonly addressPayload?: (message: NotifierAddressMessage) => RefInput<A> | null;
}
