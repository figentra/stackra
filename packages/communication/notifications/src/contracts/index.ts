/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./contracts` entry of @stackra/notifications, the leaf entry with the `MailTransport`
 *          port and its `OutboundMail`, until `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. The leaf: it imports no other entry of this package. Both are
 *           exported here only, never from `.` (ADR 0294 decision 15).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision.
 */
export { MailTransport } from "#contracts/ports/mail-transport.port";
export type { OutboundMail } from "#contracts/types/outbound-mail.type";
