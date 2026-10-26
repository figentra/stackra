/**
 * Stackra file contract:
 * Purpose: the `TenantTokens` port: where tenant tokens are kept, by the SHA-256 of the token, so an anonymous call
 *          (an iCal feed, a public link) finds its tenant before any tenant is set.
 * Boundary: an abstract class that is its own token. The OS tenancy service implements it over a platform table (no
 *           tenant policy: it is read before the tenant is known); this package hashes and checks, and
 *           `TenantTokenService` keeps the rules. A hash is the key, never the token.
 * Runtime: isomorphic
 * Governing contract: ADR 0239; ADR 0263 (ports and drivers); OS scheduling-calendar SPEC gap 2.
 */
import { Port } from "@stackra/contracts";

import type { TenantToken } from "#core/types/tenant-token.type";

/**
 * Keeps tenant tokens by hash.
 *
 * @example
 * const token = await store.find(hash);
 */
export abstract class TenantTokens extends Port {
  /** Records `token` under `hash`. */
  abstract save(hash: string, token: TenantToken): Promise<void>;

  /** The token recorded under `hash`, or `undefined`. */
  abstract find(hash: string): Promise<TenantToken | undefined>;

  /** Forgets the token under `hash`; nothing when there is none. */
  abstract delete(hash: string): Promise<void>;
}
