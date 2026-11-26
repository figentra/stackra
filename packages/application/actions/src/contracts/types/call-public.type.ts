/**
 * Stackra file contract:
 * Purpose: `CallPublic`, what an `api_client` caller must hold to call a `public` operation: its required scopes and
 *          whether only exact permission keys count.
 * Boundary: a type only, resolved by the pipeline from the operation's `public` option and registration. A selector on a
 *           key never covers an operation at L3 or above, or one with approval or step-up (`exactOnly`).
 * Runtime: isomorphic
 * Governing contract: ADR 0278 (amendment of 2026-11-09); STA-2646.
 */

/** A public operation's requirement on an API key. */
export interface CallPublic {
  /** The permission keys every one of which the key must cover: `public.scopes`, else the operation's permission. */
  readonly scopes: readonly string[];

  /** Only an exact permission key on the key counts, never a selector. */
  readonly exactOnly: boolean;
}
