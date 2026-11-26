/**
 * Stackra file contract:
 * Purpose: `CallCredential`, the verified API key a call came with (ADR 0278): the key's public id, the scopes it
 *          grants, whether it is a publishable key, and the `Stackra-Version` date it was issued at.
 * Boundary: a type only. Set by the transport from the verified key (`CallAuthenticator`), never from input; never the
 *           key text or its hash. Read by the pipeline (only a `public` operation answers an `api_client`) and by
 *           `AccessControl` (the scopes are the caller's grants).
 * Runtime: isomorphic
 * Governing contract: ADR 0278 (amendment of 2026-11-09: the gateway's API-key path); ADR 0098 (amendment of
 *                     2026-11-09: the `api_client` actor); STA-2646.
 */

/** The API key behind an `api_client` call. */
export interface CallCredential {
  /** Always an API key today. */
  readonly kind: "api_key";

  /** The key's public id, for the request log, the audit and per-key limits; never the key text. */
  readonly id: string;

  /** The permission keys and selectors the key grants. */
  readonly scopes: readonly string[];

  /** Whether it is a publishable key, which a public write refuses unless it opts in. */
  readonly publishable: boolean;

  /** The `Stackra-Version` date the key was issued at, which versioning uses when the request sends none. */
  readonly versionPin?: string;
}
