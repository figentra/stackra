/**
 * Stackra file contract:
 * Purpose: the `TemplateOverrides` port: every template candidate of a notification on a channel (the code default and
 *          each scope's override, in every locale and variant), for `resolveTemplate` to choose from.
 * Boundary: an abstract class that is its own token; the notifications service reads studio documents and lang files to
 *           answer it. It returns candidates only; the cascade is `resolveTemplate`'s.
 * Runtime: isomorphic
 * Governing contract: ADR 0223 (decision 3); ADR 0270 (decision 12).
 */
import { Port } from "@stackra/contracts";

import type { NotificationChannel } from "#contracts/enums/notification-channel.enum";
import type { NotificationTemplate } from "#contracts/types/notification-template.type";

/**
 * Answers the template candidates that override a notification's default template.
 *
 * @example
 * const candidates = await overrides.candidates("orders.order_receipt", NotificationChannel.Sms);
 */
export abstract class TemplateOverrides extends Port {
  /** Every candidate of `key` on `channel`. */
  abstract candidates(
    key: string,
    channel: NotificationChannel,
  ): Promise<readonly NotificationTemplate[]>;
}
