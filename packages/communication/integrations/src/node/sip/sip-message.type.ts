/**
 * Stackra file contract:
 * Purpose: `SipMessage`, one SIP request or response (RFC 3261 section 7) as the SIP trunk driver reads and writes it:
 *          the start line, the headers in order and the body.
 * Boundary: a type only. Compact header names are already expanded (`i` is `Call-ID`); a comma list in `Via`,
 *           `Route` and `Record-Route` is one entry per value. Numbers in the headers are personal data and are
 *           never logged.
 * Runtime: node
 * Governing contract: RFC 3261 (section 7); ADR 0376 (decision 7: the SIP driver).
 */

/** A SIP request (`method` and `uri`) or response (`status` and `reason`). */
export interface SipMessage {
  /** The request method (`INVITE`); absent on a response. */
  readonly method?: string;

  /** The Request-URI; absent on a response. */
  readonly uri?: string;

  /** The response status (`200`); absent on a request. */
  readonly status?: number;

  /** The response reason phrase (`OK`); absent on a request. */
  readonly reason?: string;

  /** Each header as name and value, in order. */
  readonly headers: readonly (readonly [name: string, value: string])[];

  /** The body (SDP, a sipfrag); empty when there is none. */
  readonly body: string;
}
