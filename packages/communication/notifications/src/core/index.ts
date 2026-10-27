/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `.` entry of @stackra/notifications, which has several public files, until
 *          `stackra gen` writes the entry barrels (STA-339). The vendor Integrations and Connections and the
 *          provider maps moved to the OS integrations service (R3-8, STA-1281). The inbound WhatsApp drivers
 *          (`memory`, `meta`) and Meta's signature recipe are here (ADR 0448). The content-free check and the
 *          mandatory-category answer are here (STA-964). The `DeliveryRecorded` integration event is here (stackra-207).
 * Boundary: names each re-export and declares nothing. `MailTransport` and `OutboundMail` are not here: they are
 *           exported from `./contracts` only (ADR 0294 decision 15). `MailMessage` is a type here: the Notifier builds
 *           it. The shipped schema is re-exported under its generated name (`NotificationsConfig$`).
 *           `prepareNotification`, `htmlToText`, `NotificationBase`, the base64url, VAPID and Web Push
 *           helpers stay internal.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision; ADR 0127 2026-10-24 note.
 */
export { NotificationsConfig } from "#config/notifications.config";
export { Notification } from "#core/bases/notification.base";
export { CONTENT_FREE_FIELDS } from "#core/constants/content-free-fields.constant";
export { META_WHATSAPP_WEBHOOK_SIGNATURE } from "#core/constants/meta-whatsapp-webhook-signature.constant";
export { NOTIFICATIONS_CONFIG_SCHEMA as NotificationsConfig$ } from "#core/constants/notifications-config-schema.constant";
export { ConnectionMailTransportDriver } from "#core/drivers/connection-mail-transport.driver";
export { ConnectionSmsTransportDriver } from "#core/drivers/connection-sms-transport.driver";
export { ConnectionWhatsAppTransportDriver } from "#core/drivers/connection-whatsapp-transport.driver";
export { DevicePushTransportDriver } from "#core/drivers/device-push-transport.driver";
export { MemoryNotifierDriver } from "#core/drivers/memory-notifier.driver";
export { MemoryWhatsAppInboundDriver } from "#core/drivers/memory-whatsapp-inbound.driver";
export { MetaWhatsAppInboundDriver } from "#core/drivers/meta-whatsapp-inbound.driver";
export { NotificationCategory } from "#core/enums/notification-category.enum";
export { DeliveryRecorded } from "#core/events/delivery-recorded.event";
export { NoTemplateError } from "#core/errors/no-template.error";
export { RestrictedFieldError } from "#core/errors/restricted-field.error";
export { assertContentFree } from "#core/functions/assert-content-free.function";
export { canMute } from "#core/functions/can-mute.function";
export { dueEscalations } from "#core/functions/due-escalations.function";
export { resolveTemplate } from "#core/functions/resolve-template.function";
export { sendAfter } from "#core/functions/send-after.function";
export { twiml } from "#core/functions/twiml.function";
export { Notifier } from "#core/ports/notifier.port";
export { NotificationsOptions } from "#core/schemas/notifications-options.schema";
export type { NotificationDelivery } from "#core/types/notification-delivery.type";
export type { NotificationOptions } from "#core/types/notification-options.type";
export type { NotifierDriverName } from "#core/types/notifier-driver-name.type";
export type { MailMessage } from "#core/values/mail-message.value";
export { Recipient } from "#core/values/recipient.value";
