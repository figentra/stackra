/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./contracts` entry of @stackra/notifications, the leaf entry with the channel ports
 *          (`MailTransport`, `SmsTransport`, `WhatsAppTransport`, `PushTransport`, `InAppStore`, `ChatTransport`), the
 *          inbound `WhatsAppInbound` port (ADR 0448), the
 *          `ContentFreeData` (STA-964), the service ports (`PushTokenStore`, `SendLog`, `TemplateOverrides`), the provider interfaces and the types they
 *          exchange (`NotificationDeliveryEvent` among them, stackra-207), until `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. The leaf: it imports no other entry of this package. Each is
 *           exported here only, never from `.` (ADR 0294 decision 15).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision.
 */
export { NotificationChannel } from "#contracts/enums/notification-channel.enum";
export { TemplateVariant } from "#contracts/enums/template-variant.enum";
export { ChatTransport } from "#contracts/ports/chat-transport.port";
export { InAppStore } from "#contracts/ports/in-app-store.port";
export { MailTransport } from "#contracts/ports/mail-transport.port";
export { PushTokenStore } from "#contracts/ports/push-token-store.port";
export { PushTransport } from "#contracts/ports/push-transport.port";
export { SendLog } from "#contracts/ports/send-log.port";
export { SmsTransport } from "#contracts/ports/sms-transport.port";
export { TemplateOverrides } from "#contracts/ports/template-overrides.port";
export { WhatsAppInbound } from "#contracts/ports/whatsapp-inbound.port";
export { WhatsAppTransport } from "#contracts/ports/whatsapp-transport.port";
export type { ContentFreeData } from "#contracts/types/content-free-data.type";
export type { EscalationState } from "#contracts/types/escalation-state.type";
export type { EscalationStep } from "#contracts/types/escalation-step.type";
export type { InboundWhatsApp } from "#contracts/types/inbound-whatsapp.type";
export type { InboundWhatsAppCartItem } from "#contracts/types/inbound-whatsapp-cart-item.type";
export type { InAppEntry } from "#contracts/types/in-app-entry.type";
export type { InAppMessage } from "#contracts/types/in-app-message.type";
export type { MailSender } from "#contracts/types/mail-sender.type";
export type { NotificationDeliveryEvent } from "#contracts/types/notification-delivery-event.type";
export type { NotificationTemplate } from "#contracts/types/notification-template.type";
export type { OutboundChatMessage } from "#contracts/types/outbound-chat-message.type";
export type { OutboundMail } from "#contracts/types/outbound-mail.type";
export type { OutboundPush } from "#contracts/types/outbound-push.type";
export type { OutboundSms } from "#contracts/types/outbound-sms.type";
export type { OutboundWhatsApp } from "#contracts/types/outbound-whatsapp.type";
export type { PushOutcome } from "#contracts/types/push-outcome.type";
export type { PushTarget } from "#contracts/types/push-target.type";
export type { QuietHours } from "#contracts/types/quiet-hours.type";
export type { SmsSender } from "#contracts/types/sms-sender.type";
export type { WhatsAppSender } from "#contracts/types/whatsapp-sender.type";
