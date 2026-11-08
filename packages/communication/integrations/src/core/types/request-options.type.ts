/**
 * Stackra file contract:
 * Purpose: `RequestOptions`, the last argument of a managed client call: query parameters, extra headers, the call's
 *          idempotency key, an abort signal, whether the body is sent as a form instead of JSON or as a raw body
 *          (`body`), and whether the answer is read as bytes or as text.
 * Boundary: a type only. Credentials are never passed here: the client adds them from the Integration's `auth`.
 * Runtime: isomorphic
 * Governing contract: ADR 0308 (rule 13).
 */
import type { RawBody } from "#core/types/raw-body.type";

/**
 * The options of one managed client call.
 *
 * @example
 * await api.post<ResendSendResult>("/emails", mail, { idempotencyKey });
 */
export interface RequestOptions {
  /** Query parameters, added to the URL. */
  readonly query?: Readonly<Record<string, string | number | boolean>>;

  /** Extra headers; the client's own headers (authentication, idempotency) win. */
  readonly headers?: Readonly<Record<string, string>>;

  /** Sent in the Integration's idempotency header, which also lets a `POST` or `PATCH` retry. */
  readonly idempotencyKey?: string;

  /** Aborts the call and its retries. */
  readonly signal?: AbortSignal;

  /**
   * Sends the body as `application/x-www-form-urlencoded` (Twilio, Unifonic) instead of JSON, or as JSON when false.
   * Left out, the Integration's `requestBody` decides. A form body must be a flat record of strings, numbers and
   * booleans; an array value repeats its key.
   */
  readonly form?: boolean;

  /**
   * Reads the answer as raw bytes (a `Uint8Array`: a label PDF, an image) instead of parsing it as JSON, and asks for
   * any media type unless the call sets `accept`. A refusal's body is still read as JSON for the provider's code.
   */
  readonly bytes?: boolean;

  /**
   * Sends this body exactly as given, with its own `content-type`, instead of the call's JSON or form body (a SOAP
   * envelope). The call's own body argument must then be left out. Auth, retries, rate limits and the egress rule are
   * unchanged.
   */
  readonly body?: RawBody;

  /**
   * Reads the answer as text (a SOAP reply, an XML document) instead of parsing it as JSON, and asks for any media type
   * unless the call sets `accept`. A refusal's body is still read for the provider's code only, never returned.
   */
  readonly text?: boolean;
}
