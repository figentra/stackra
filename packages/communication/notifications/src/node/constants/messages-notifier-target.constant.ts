/**
 * Stackra file contract:
 * Purpose: `MESSAGES_NOTIFIER_TARGET`, the `notifications` Notifier driver's default target: `messages.message.send@1`
 *          with the mail as its input (template key, principal, subject, HTML, text).
 * Boundary: data. A message without a mail channel is skipped, as the action is mail-only; the category and the market
 *           are not part of this action's input. A host whose notifications service has another module or input passes
 *           its own `NotifierTarget`.
 * Runtime: node
 * Governing contract: ADR 0223; ADR 0260 (decision 4); ADR 0422 (decision 1).
 */
import { SEND_MESSAGE_ACTION } from "#node/constants/send-message-action.constant";
import type { NotifierMessage } from "#node/types/notifier-message.type";
import type { NotifierTarget } from "#node/types/notifier-target.type";

/**
 * The default target.
 *
 * @example
 * new NotificationsNotifierDriver(transport, i18n, assets, MESSAGES_NOTIFIER_TARGET);
 */
export const MESSAGES_NOTIFIER_TARGET: NotifierTarget<typeof SEND_MESSAGE_ACTION> = Object.freeze({
  action: SEND_MESSAGE_ACTION,
  payload: ({ template, principalId, channels }: NotifierMessage) =>
    channels.mail === undefined
      ? null
      : {
          mail: template,
          to: { principalId },
          subject: channels.mail.subject,
          html: channels.mail.html,
          text: channels.mail.text,
        },
});
