/**
 * Stackra file contract:
 * Purpose: `InboxRequest`, what the generated `/events/inbox` route hands `RelayInboxService`: the method, the headers
 *          and the raw body, unparsed.
 * Boundary: a type only. The body stays raw so the signature is checked over the bytes that were sent, before any
 *           parse; header names are matched without case.
 * Runtime: isomorphic
 * Governing contract: ADR 0511 (decision 18, amendment of 2026-11-02); ADR 0294 (decision 16: a raw route).
 */

/** One request to the consumer's inbox. */
export interface InboxRequest {
  /** The HTTP method; only `POST` is taken. */
  readonly method: string;

  /** The request headers by name. */
  readonly headers: Readonly<Record<string, string | readonly string[] | undefined>>;

  /** The raw body. */
  readonly body: string | Uint8Array;
}
