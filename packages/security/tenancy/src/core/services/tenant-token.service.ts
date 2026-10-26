/**
 * Stackra file contract:
 * Purpose: `TenantTokenService`, anonymous tenant resolution by token: issue an opaque token for a tenant and a
 *          purpose, resolve a presented token to its tenant (for that purpose only), and revoke one.
 * Boundary: over `TenantTokens`. A token is `ttk_` and 64 hex characters of 32 random bytes; only its SHA-256 is
 *           stored, so a leaked table opens nothing. The resolved tenant is the one the caller then hands to
 *           `withTenant` as the anonymous actor's `tenantId`, so the tenant still never comes from a body or a header;
 *           the record the token opens (a feed, a link) is the caller's own, read inside that tenant. A token of
 *           another purpose, a malformed or an unknown one resolves to `undefined` alike, so a probe learns nothing.
 * Runtime: isomorphic
 * Governing contract: ADR 0239; ADR 0098 (decision 6: the tenant from the verified credential, here the token); ADR
 *                     0210 (decision 3); OS scheduling-calendar SPEC gap 2 and open question 8.
 */
import { Service } from "@stackra/container";
import type { PublicId } from "@stackra/contracts";

import { isTenantId } from "#core/functions/is-tenant-id.function";
import { TenantTokens } from "#core/ports/tenant-tokens.port";

/** A token: the prefix and 64 lowercase hex characters. */
const TOKEN = /^ttk_[0-9a-f]{64}$/;

/** Lowercase hex of `bytes`. */
const hex = (bytes: Uint8Array): string =>
  Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");

/** The stored key of `token`: its SHA-256, hex. */
async function hashOf(token: string): Promise<string> {
  const digest = await globalThis.crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return hex(new Uint8Array(digest));
}

/**
 * Tenant tokens for anonymous calls.
 *
 * @example
 * const token = await tokens.issue(tenantId, "calendar.feed");
 * const tenantId = await tokens.resolve(presented, "calendar.feed"); // then withTenant({ ...anonymous, tenantId }, …)
 */
export class TenantTokenService extends Service {
  /** The store. */
  private readonly store: TenantTokens;

  /** @param store - where token hashes are kept. */
  constructor(store: TenantTokens) {
    super();
    this.store = store;
  }

  /**
   * A new token that resolves to `tenantId` for `purpose`; the caller hands it out once and keeps no copy.
   *
   * @throws TypeError when `tenantId` is not a tenant id.
   * @throws RangeError when `purpose` is empty.
   */
  async issue(tenantId: PublicId<"scp">, purpose: string): Promise<string> {
    if (!isTenantId(tenantId))
      throw new TypeError(`"${tenantId}" is not a tenant id: the public id of a scope node`);
    if (purpose === "") throw new RangeError("a tenant token names its purpose");
    const token = `ttk_${hex(globalThis.crypto.getRandomValues(new Uint8Array(32)))}`;
    await this.store.save(await hashOf(token), { tenantId, purpose });
    return token;
  }

  /** The tenant `token` resolves to for `purpose`, or `undefined` for a malformed, unknown or other-purpose token. */
  async resolve(token: string, purpose: string): Promise<PublicId<"scp"> | undefined> {
    if (!TOKEN.test(token)) return undefined;
    const found = await this.store.find(await hashOf(token));
    return found?.purpose === purpose ? found.tenantId : undefined;
  }

  /** Revokes `token`; a malformed or unknown one is a no-op. */
  async revoke(token: string): Promise<void> {
    if (TOKEN.test(token)) await this.store.delete(await hashOf(token));
  }
}
