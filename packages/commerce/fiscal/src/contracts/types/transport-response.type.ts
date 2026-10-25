/**
 * Stackra file contract:
 * Purpose: `TransportResponse`, the answer to a `TransportRequest`: status, headers and body text.
 * Boundary: a type only; a network failure is thrown by the binding, not returned.
 * Runtime: isomorphic
 * Governing contract: ADR 0364 (decision 4).
 */

/** An HTTP answer. */
export type TransportResponse = {
  /** HTTP status code. */
  readonly status: number;
  /** Response headers, lower-case names. */
  readonly headers: Readonly<Record<string, string>>;
  /** Response body as text. */
  readonly body: string;
};
