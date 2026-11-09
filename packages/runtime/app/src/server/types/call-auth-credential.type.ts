/**
 * Stackra file contract:
 * Purpose: `CallAuthCredential`, the verified API key behind an `api_client` call, as the authenticator answers it.
 * Boundary: a type only; structurally `@stackra/actions`' `CallCredential` (this package does not depend on it at
 *           runtime). Never the key text or its hash.
 * Runtime: node
 * Governing contract: ADR 0278 (amendment of 2026-11-09: the gateway's API-key path); STA-2532.
 */

/** The API key behind an `api_client` call, as the authenticator verified it. */
export interface CallAuthCredential {
  /** Always an API key today. */
  readonly kind: "api_key";

  /** The key's public id; never the key text. */
  readonly id: string;

  /** The permission keys and selectors the key grants. */
  readonly scopes: readonly string[];

  /** Whether it is a publishable key. */
  readonly publishable: boolean;

  /** The `Stackra-Version` date the key was issued at. */
  readonly versionPin?: string;
}
