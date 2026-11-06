/**
 * Stackra file contract:
 * Purpose: what `installationToken` returns: a GitHub installation token, or the answer the Worker gives instead.
 * Boundary: types only.
 * Runtime: worker
 * Governing contract: STA-2133.
 */

/** A token for one dispatch, or a 502 (GitHub refused) or 503 (the App id or key is missing) answer. */
export type AppToken =
  | { readonly token: string }
  | { readonly status: 502 | 503; readonly code: string; readonly message: string };
