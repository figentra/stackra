/**
 * Stackra file contract:
 * Purpose: `NotificationMails`, the argument of `registerNotificationMails`: each notification's `.mail.tsx` body,
 *          bound by name, and the member's lang loaders, which the `notifications` Notifier driver renders with.
 * Boundary: a type only. Gen writes both from the member's source: a body is the `.mail.tsx` of the notification's
 *           stem, and `catalogues` is the `loaders` table of `#stackra/i18n` (namespace, then locale, to a loader).
 * Runtime: node
 * Governing contract: ADR 0223 (as amended by ADR 0294: bodies bound by name); ADR 0080 (lang loaders).
 */
import type { AnyClass } from "@stackra/container";
import type { LoadCatalogue } from "@stackra/i18n";

import type { Notification } from "#core/bases/notification.base";
import type { MailBody } from "#react/mail/mail-body.type";

/** What a member registers for its notifications' mail. */
export interface NotificationMails {
  /** Each notification class with its mail body. */
  // oxlint-disable-next-line typescript/no-explicit-any -- reason: each body's props are its own notification's data
  readonly bodies: readonly (readonly [AnyClass<Notification>, MailBody<any>])[];

  /** The lang loaders by namespace and locale (`#stackra/i18n`'s `loaders`). */
  readonly catalogues: Readonly<Record<string, Readonly<Partial<Record<string, LoadCatalogue>>>>>;
}
