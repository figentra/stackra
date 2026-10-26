/**
 * Stackra file contract:
 * Purpose: `DELIVERY_NOTIFIER_TARGET`, the `notifications` Notifier driver's `delivery` target
 *          (`notifications.target: delivery`): `delivery.message.send@1` with the template key, the category code, the
 *          template values, the rendered mail when there is one, and the Market; principals and mail addresses.
 * Boundary: data. The category is the notification's `messageCategory`, else its `NotificationCategory` code; the
 *           service refuses a code it has no category for. The template values are the data's top-level strings and
 *           finite numbers (ids, codes, amounts); anything else is the rendered mail's business. Every channel is the
 *           service's choice from its category chain, so a message without a mail channel is still sent.
 * Runtime: node
 * Governing contract: ADR 0422 (decision 1, as amended by STA-1235); ADR 0223; ADR 0260 (decision 4).
 */
import { SEND_DELIVERY_MESSAGE_ACTION } from "#node/constants/send-delivery-message-action.constant";
import type { NotifierMessage } from "#node/types/notifier-message.type";
import type { NotifierTarget } from "#node/types/notifier-target.type";

/**
 * The `delivery` target.
 *
 * @example
 * // runway: notifications.target: delivery
 * new NotificationsNotifierDriver(transport, i18n, assets, DELIVERY_NOTIFIER_TARGET, market);
 */
export const DELIVERY_NOTIFIER_TARGET: NotifierTarget<typeof SEND_DELIVERY_MESSAGE_ACTION> =
  Object.freeze({
    action: SEND_DELIVERY_MESSAGE_ACTION,
    payload: (message) => inputOf(message, { principalId: message.principalId }),
    addressPayload: (message) => inputOf(message, { email: message.email }),
  });

/** The action's input of `message` for `to`. */
function inputOf(
  message: Omit<NotifierMessage, "principalId">,
  to: { principalId: NotifierMessage["principalId"] } | { email: string },
) {
  return {
    notification: message.template,
    category: message.messageCategory ?? message.category,
    to,
    data: valuesOf(message.data),
    mail: message.channels.mail ?? null,
    market: message.market ?? null,
  };
}

/** The top-level string and finite-number entries of `data`, the template values. */
function valuesOf(data: unknown): Record<string, string | number> {
  if (typeof data !== "object" || data === null) return {};
  return Object.fromEntries(
    Object.entries(data).filter(
      ([, value]) =>
        typeof value === "string" || (typeof value === "number" && Number.isFinite(value)),
    ),
  );
}
