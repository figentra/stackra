/**
 * Stackra file contract:
 * Purpose: `NOTIFICATION_MAILS`, what `registerNotificationMails` recorded: each notification class's mail body and
 *          the lang loaders the `notifications` Notifier driver reads.
 * Boundary: internal to `./node`; one table per process, written at startup by the generated registration and read
 *           by the driver. A later registration adds bodies and namespaces, and replaces a namespace's loaders.
 * Runtime: node
 * Governing contract: ADR 0223 (as amended by ADR 0294: bodies bound by name); ADR 0080 (lang loaders).
 */
import type { LoadCatalogue } from "@stackra/i18n";

import type { MailBody } from "#react/mail/mail-body.type";

/**
 * The registered mail bodies and lang loaders.
 *
 * @example
 * const body = NOTIFICATION_MAILS.bodies.get(notification.constructor);
 */
export const NOTIFICATION_MAILS = {
  /** Notification class to its mail body. */
  // oxlint-disable-next-line typescript/no-explicit-any -- reason: each body's props are its own notification's data
  bodies: new WeakMap<object, MailBody<any>>(),

  /** Namespace to its loaders by locale. */
  catalogues: new Map<string, Readonly<Partial<Record<string, LoadCatalogue>>>>(),
};
