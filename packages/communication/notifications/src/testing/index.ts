/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./testing` entry of @stackra/notifications (`renderMail`, `MemoryNotifier` and a fake
 *          of each channel port: `MailTransportFake`, `SmsTransportFake`, `InAppStoreFake`, `ChatTransportFake`) until
 *          `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. Imports this package's other entries only; no other package's
 *           `./testing` (ADR 0269 decision 3). `MemoryNotifier` is a type here: the driver is exported from `.`.
 * Runtime: node
 * Governing contract: ADR 0294 (decision 15); ADR 0269 (decision 3); the STA-347 stand-in barrel decision.
 */
export { ChatTransportFake } from "#testing/chat-transport.fake";
export { renderMail } from "#testing/functions/render-mail.function";
export { InAppStoreFake } from "#testing/in-app-store.fake";
export { MailTransportFake } from "#testing/mail-transport.fake";
export { PushTransportFake } from "#testing/push-transport.fake";
export { SmsTransportFake } from "#testing/sms-transport.fake";
export { WhatsAppTransportFake } from "#testing/whatsapp-transport.fake";
export type { MemoryNotifier } from "#testing/types/memory-notifier.type";
