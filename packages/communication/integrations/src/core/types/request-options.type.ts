/**
 * Stackra file contract:
 * Purpose: `RequestOptions`, the last argument of a managed client call: query parameters, extra headers, the call's
 *          idempotency key, an abort signal, and whether the body is sent as a form instead of JSON.
 * Boundary: a type only. Credentials are never passed here: the client adds them from the Integration's `auth`.
 * Runtime: isomorphic
 * Governing contract: ADR 0308 (rule 13).
 */

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
   * Sends the body as `application/x-www-form-urlencoded` (Twilio, Unifonic) instead of JSON. The body must then be a
   * flat record of strings, numbers and booleans; an array value repeats its key.
   */
  readonly form?: boolean;
}
