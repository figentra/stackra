/**
 * Stackra file contract:
 * Purpose: `EdgeSignatureInput`, the fields the edge Worker's HMAC covers and the API pipeline recomputes: the four
 *          identity headers, the request id, the timestamp, the method, the path and a hash of the body.
 * Boundary: a type only. How the fields are joined into the signed bytes is fixed by ADR 0437 and implemented once in
 *           the guard; both sides share this shape so neither drops a field. `tenant` is null on a platform host.
 * Runtime: isomorphic
 * Governing contract: ADR 0437 (not yet landed; app-shells 5.1 point 4 and 16 point 2: the HMAC covers a timestamp, the method, the path, a body hash
 *                     and the request id).
 */

/** What one edge signature covers. */
export interface EdgeSignatureInput {
  /** The scope id, or null on a platform host. */
  readonly scope: string | null;

  /** The product key. */
  readonly product: string;

  /** The surface key. */
  readonly surface: string;

  /** The identity realm. */
  readonly realm: string;

  /** The request id, also the replay nonce. */
  readonly requestId: string;

  /** When the Worker signed, Unix seconds; the API refuses one older than its allowed age. */
  readonly timestamp: number;

  /** The HTTP method, upper case. */
  readonly method: string;

  /** The path and query as forwarded. */
  readonly path: string;

  /** The SHA-256 of the body, hex; the hash of the empty string for no body. */
  readonly bodyHash: string;
}
