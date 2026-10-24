/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `.` entry of @stackra/notifications, which has several public files, until
 *          `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. `MailTransport` and `OutboundMail` are not here: they are
 *           exported from `./contracts` only (ADR 0294 decision 15). `MailMessage` is a type here: the Notifier builds
 *           it. The shipped schema is re-exported under its generated name (`NotificationsConfig$`).
 *           `prepareNotification`, `htmlToText` and `NotificationBase` stay internal.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision; ADR 0127 2026-10-24 note.
 */
export { NotificationsConfig } from "#config/notifications.config";
export { Notification } from "#core/bases/notification.base";
export { NOTIFICATIONS_CONFIG_SCHEMA as NotificationsConfig$ } from "#core/constants/notifications-config-schema.constant";
export { MemoryNotifierDriver } from "#core/drivers/memory-notifier.driver";
export { NotificationCategory } from "#core/enums/notification-category.enum";
export { Notifier } from "#core/ports/notifier.port";
export { NotificationsOptions } from "#core/schemas/notifications-options.schema";
export type { NotificationDelivery } from "#core/types/notification-delivery.type";
export type { NotificationOptions } from "#core/types/notification-options.type";
export type { NotifierDriverName } from "#core/types/notifier-driver-name.type";
export type { MailMessage } from "#core/values/mail-message.value";
export { Recipient } from "#core/values/recipient.value";
