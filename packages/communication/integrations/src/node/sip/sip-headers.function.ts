/**
 * Stackra file contract:
 * Purpose: `sipHeaders`, every value of one header of a SIP message, matched without regard to case.
 * Boundary: a pure function; compact names are already expanded by `parseSip`.
 * Runtime: node
 * Governing contract: RFC 3261 (section 7.3); ADR 0376 (decision 7: the SIP driver).
 */
import type { SipMessage } from "#node/sip/sip-message.type";

/**
 * The values of header `name` in `message`, in order.
 *
 * @example
 * const [callId] = sipHeaders(response, "Call-ID");
 */
export function sipHeaders(message: SipMessage, name: string): string[] {
  const wanted = name.toLowerCase();
  return message.headers.filter(([key]) => key.toLowerCase() === wanted).map(([, value]) => value);
}
