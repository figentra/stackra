/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./contracts` entry of @stackra/notifications, the leaf entry with the channel ports
 *          (`MailTransport`, `SmsTransport`, `InAppStore`, `ChatTransport`) and the types they exchange, until
 *          `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. The leaf: it imports no other entry of this package. Each is
 *           exported here only, never from `.` (ADR 0294 decision 15).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision.
 */
export { ChatTransport } from "#contracts/ports/chat-transport.port";
export { InAppStore } from "#contracts/ports/in-app-store.port";
export { MailTransport } from "#contracts/ports/mail-transport.port";
export { SmsTransport } from "#contracts/ports/sms-transport.port";
export type { InAppEntry } from "#contracts/types/in-app-entry.type";
export type { InAppMessage } from "#contracts/types/in-app-message.type";
export type { OutboundChatMessage } from "#contracts/types/outbound-chat-message.type";
export type { OutboundMail } from "#contracts/types/outbound-mail.type";
export type { OutboundSms } from "#contracts/types/outbound-sms.type";
