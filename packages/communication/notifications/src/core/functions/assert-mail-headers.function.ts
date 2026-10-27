/**
 * Stackra file contract:
 * Purpose: `assertMailHeaders(mail)`, which refuses an `OutboundMail` header whose name is not a field name (a space or
 *          colon in it) or whose value holds a line break, so no header can inject another (a hidden `Bcc`).
 * Boundary: pure and internal (not exported from `.`); the `connection` mail transport runs it before it calls a
 *           provider. The error names the header, never its value.
 * Runtime: isomorphic
 * Governing contract: RFC 5322 (section 2.2); stackra-218 (STA-1376).
 */
import type { OutboundMail } from "#contracts/types/outbound-mail.type";

/** A header field name (RFC 5322 printable ASCII, no colon). */
const HEADER_NAME = /^[\x21-\x39\x3b-\x7e]+$/;

/**
 * Refuses a header whose name is not a field name or whose value holds a line break.
 *
 * @throws TypeError naming the header (never its value).
 */
export function assertMailHeaders(mail: OutboundMail): void {
  for (const [name, value] of Object.entries(mail.headers ?? {}))
    if (!HEADER_NAME.test(name) || /[\r\n]/.test(value))
      throw new TypeError(
        `mail header ${JSON.stringify(name)}: a header name or value holds a line break or colon`,
      );
}
