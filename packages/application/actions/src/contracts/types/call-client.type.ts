/**
 * Stackra file contract:
 * Purpose: `CallClient`, the network client a call arrived from: its address and user agent, as the edge saw them.
 * Boundary: a type only. The transport fills it from the connection (or the edge's trusted forwarding header), never
 *           from request input; the pipeline hands it to `ctx.client` and to no port and no audit entry. Personal data:
 *           a handler that keeps it (traffic counting, abuse checks) hashes or truncates it under its own retention.
 * Runtime: isomorphic
 * Governing contract: ADR 0136 (decision 1: the handler context; Note STA-1248).
 */

/** Where one call came from on the network. */
export interface CallClient {
  /** The client's IP address (`203.0.113.7`, `2001:db8::1`). */
  readonly address: string;

  /** The `User-Agent` the client sent, when it sent one. */
  readonly userAgent?: string;
}
