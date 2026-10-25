/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `.` entry of @stackra/notifications, which has several public files, until
 *          `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. `MailTransport` and `OutboundMail` are not here: they are
 *           exported from `./contracts` only (ADR 0294 decision 15). `MailMessage` is a type here: the Notifier builds
 *           it. The shipped schema is re-exported under its generated name (`NotificationsConfig$`).
 *           `prepareNotification`, `htmlToText`, `NotificationBase`, the SigV4 signer, the base64url, VAPID and Web Push
 *           helpers stay internal.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision; ADR 0127 2026-10-24 note.
 */
export { NotificationsConfig } from "#config/notifications.config";
export { Notification } from "#core/bases/notification.base";
export { NOTIFICATIONS_CONFIG_SCHEMA as NotificationsConfig$ } from "#core/constants/notifications-config-schema.constant";
export { MAIL_CONNECTIONS } from "#core/constants/mail-connections.constant";
export { SMS_CONNECTIONS } from "#core/constants/sms-connections.constant";
export { VOICE_CONNECTIONS } from "#core/constants/voice-connections.constant";
export { WHATSAPP_CONNECTIONS } from "#core/constants/whatsapp-connections.constant";
export { ConnectionMailTransportDriver } from "#core/drivers/connection-mail-transport.driver";
export { ConnectionSmsTransportDriver } from "#core/drivers/connection-sms-transport.driver";
export { ConnectionWhatsAppTransportDriver } from "#core/drivers/connection-whatsapp-transport.driver";
export { DevicePushTransportDriver } from "#core/drivers/device-push-transport.driver";
export { MemoryNotifierDriver } from "#core/drivers/memory-notifier.driver";
export { NotificationCategory } from "#core/enums/notification-category.enum";
export { NoTemplateError } from "#core/errors/no-template.error";
export { dueEscalations } from "#core/functions/due-escalations.function";
export { resolveTemplate } from "#core/functions/resolve-template.function";
export { sendAfter } from "#core/functions/send-after.function";
export { twiml } from "#core/functions/twiml.function";
export { Notifier } from "#core/ports/notifier.port";
export { CequensConnection } from "#core/providers/cequens/cequens.connection";
export { CequensIntegration } from "#core/providers/cequens/cequens.integration";
export { ExpoIntegration } from "#core/providers/expo/expo.integration";
export { MetaWhatsAppConnection } from "#core/providers/meta-whatsapp/meta-whatsapp.connection";
export { MetaWhatsAppIntegration } from "#core/providers/meta-whatsapp/meta-whatsapp.integration";
export { ResendConnection } from "#core/providers/resend/resend.connection";
export { ResendIntegration } from "#core/providers/resend/resend.integration";
export { SesConnection } from "#core/providers/ses/ses.connection";
export { SesIntegration } from "#core/providers/ses/ses.integration";
export { TaqnyatConnection } from "#core/providers/taqnyat/taqnyat.connection";
export { TaqnyatIntegration } from "#core/providers/taqnyat/taqnyat.integration";
export { TwilioConnection } from "#core/providers/twilio/twilio.connection";
export { TwilioIntegration } from "#core/providers/twilio/twilio.integration";
export { UnifonicConnection } from "#core/providers/unifonic/unifonic.connection";
export { UnifonicIntegration } from "#core/providers/unifonic/unifonic.integration";
export { NotificationsOptions } from "#core/schemas/notifications-options.schema";
export type { NotificationDelivery } from "#core/types/notification-delivery.type";
export type { NotificationOptions } from "#core/types/notification-options.type";
export type { NotifierDriverName } from "#core/types/notifier-driver-name.type";
export type { MailMessage } from "#core/values/mail-message.value";
export { Recipient } from "#core/values/recipient.value";
