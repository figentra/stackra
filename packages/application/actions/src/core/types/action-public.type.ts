/**
 * Stackra file contract:
 * Purpose: `ActionPublic`, the `public` option of an action or query: it is reachable with an API key (an `api_client`
 *          caller), with the scopes the key must hold and whether a publishable key may call it.
 * Boundary: a type only. `true` takes the operation's own permission as its scope; a write refuses a publishable key
 *           unless `publishable: true`, a read admits one unless `publishable: false`.
 * Runtime: isomorphic
 * Governing contract: ADR 0278 (amendment of 2026-11-09); ADR 0098 (the `api_client` actor); STA-2646.
 */

/** How an operation opens to API keys. */
export type ActionPublic =
  | true
  | {
      /** The permission keys a key must cover; the operation's own permission when absent. */
      readonly scopes?: readonly string[];
      /** Whether a publishable key may call it; a write's default is no, a read's is yes. */
      readonly publishable?: boolean;
    };
