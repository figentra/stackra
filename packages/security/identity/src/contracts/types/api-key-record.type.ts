/**
 * Stackra file contract:
 * Purpose: `ApiKeyRecord`, what the identity service keeps for one issued API key: its id, the SHA-256 of the key (never
 *          the key), whom it acts as, in which tenant, its scopes, the origins a publishable key is bound to, and when it
 *          expires or was revoked.
 * Boundary: a type in the leaf entry; the `ApiKeyStore` port answers it by the key's hash. The key's kind is not here:
 *           it is read from the key's own prefix, which hashed to this record.
 * Runtime: isomorphic
 * Governing contract: ADR 0278 (decisions 3 to 7); ADR 0410 (verification by key hash, STA-835).
 */
import type { PublicId } from "@stackra/contracts";

/** One stored API key. */
export interface ApiKeyRecord {
  /** The key's public id (`key_…`), what an admin screen and the audit name. */
  readonly id: PublicId;

  /** SHA-256 of the full key text, 64 lowercase hex characters. */
  readonly hash: string;

  /** The principal the key acts as (a machine user or service account). */
  readonly principal: PublicId;

  /** The tenant the key is bound to; absent for a platform key. */
  readonly tenantId?: PublicId;

  /** The scopes the key grants; checked after verification (ADR 0278 decision 6). */
  readonly scopes: readonly string[];

  /** The origins a publishable key works from (`https://shop.acme.example`, `https://*.acme.example`). */
  readonly origins: readonly string[];

  /** When the key stops working; absent for no expiry. */
  readonly expiresAt?: Date;

  /** When the key was revoked; absent while it is live. */
  readonly revokedAt?: Date;
}
