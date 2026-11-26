/**
 * Stackra file contract:
 * Purpose: `SmokeAnswer`, what the `cloudflare-workers` provider reads of one smoke request's answer: whether it is
 *          2xx, its status, its headers (the `x-stackra-version` proof) and its body (the `/-/version` route's).
 * Boundary: type only; a `Response` is one, and a test's fake answers one.
 * Runtime: node
 * Governing contract: ADR 0352 (decision 3); ADR 0536 (gate 2); STA-2786.
 */

/** One smoke request's answer. */
export type SmokeAnswer = {
  /** Whether the status is 2xx. */
  readonly ok: boolean;
  /** The HTTP status. */
  readonly status: number;
  /** The response headers, read by name (case-insensitive on a real `Response`). */
  readonly headers: { readonly get: (name: string) => string | null };
  /** The body as text; read only for the `/-/version` route. */
  readonly text: () => Promise<string>;
};
