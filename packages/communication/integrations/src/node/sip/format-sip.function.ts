/**
 * Stackra file contract:
 * Purpose: `formatSip`, the SIP message writer of the SIP trunk driver: start line, headers in order and the body,
 *          with `Content-Length` set to the body's byte length.
 * Boundary: a pure function; it writes what it is given and checks nothing else.
 * Runtime: node
 * Governing contract: RFC 3261 (section 7); ADR 0376 (decision 7: the SIP driver).
 */
import type { SipMessage } from "#node/sip/sip-message.type";

/**
 * The wire text of `message`.
 *
 * @example
 * socket.send(new TextEncoder().encode(formatSip(invite)), 5060, trunk);
 */
export function formatSip(message: SipMessage): string {
  const start =
    message.method === undefined
      ? `SIP/2.0 ${message.status ?? 500} ${message.reason ?? ""}`
      : `${message.method} ${message.uri ?? ""} SIP/2.0`;
  const length = new TextEncoder().encode(message.body).byteLength;
  const headers = message.headers
    .filter(([name]) => name.toLowerCase() !== "content-length")
    .map(([name, value]) => `${name}: ${value}`);
  return [start, ...headers, `Content-Length: ${length}`, "", message.body].join("\r\n");
}
