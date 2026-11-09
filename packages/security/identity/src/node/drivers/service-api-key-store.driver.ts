/**
 * Stackra file contract:
 * Purpose: `ServiceApiKeyStoreDriver` (`service`), the `ApiKeyStore` of a service that answers API-key calls: it reads a
 *          presented key's record from the identity service by its hash (`principals.api_key.verify@1`), keeps a verified
 *          record for `IdentityConfig.apiKeyCacheSeconds` so every call is not a round trip, and forgets a principal's
 *          records at once when told its key was revoked (`evictPrincipal`).
 * Boundary: the call is this service's own, over the injected `ClientTransport`. A key identity does not know answers
 *           `undefined` and is never cached, so a new key works at once; a transport failure throws (the verifier fails
 *           closed). The worst case after a revoke whose event has not reached this service is the cache window (30
 *           seconds by default). `lastUsedAt` stays identity's: `recordUse` writes nothing here.
 * Runtime: node
 * Governing contract: ADR 0278 (amendments of 2026-11-09: the gateway's API-key path, the cache ceiling); STA-2646.
 */
import type { ClientTransport } from "@stackra/clients/contracts";
import { Driver } from "@stackra/container";
import type { Clock } from "@stackra/contracts";
import { isRefusal, NotFoundError } from "@stackra/errors";

import type { IdentityConfig } from "#config/identity.config";
import { ApiKeyStore } from "#contracts/ports/api-key-store.port";
import type { ApiKeyRecord } from "#contracts/types/api-key-record.type";
import { IdentityKeysClient } from "#node/clients/identity-keys.client";

/** A cached record and when it stops counting. */
interface Cached {
  readonly record: ApiKeyRecord;
  readonly until: number;
}

/** Issued keys, read from the identity service. */
export class ServiceApiKeyStoreDriver extends Driver(ApiKeyStore) {
  /** The identity service's key reads. */
  private readonly identity: IdentityKeysClient;

  /** Verified records by key hash. */
  private readonly cache = new Map<string, Cached>();

  /** The hashes cached for each principal, so a revoke forgets them all. */
  private readonly byPrincipal = new Map<string, Set<string>>();

  /**
   * @param transport - the hosting service's client transport.
   * @param config - the cache window.
   * @param clock - the time the window is measured against.
   */
  constructor(
    transport: ClientTransport,
    private readonly config: IdentityConfig,
    private readonly clock: Clock,
  ) {
    super();
    this.identity = new IdentityKeysClient(transport);
  }

  /** See `ApiKeyStore.findByHash`: the cached record while it counts, else identity's answer. */
  override async findByHash(hash: string): Promise<ApiKeyRecord | undefined> {
    const now = this.clock.now().getTime();
    const cached = this.cache.get(hash);
    if (cached !== undefined && cached.until > now) return cached.record;
    let answer;
    try {
      answer = await this.identity.lookup().call({ keyHash: hash });
    } catch (error) {
      if (isRefusal(error, NotFoundError)) return undefined;
      throw error;
    }
    const record: ApiKeyRecord = {
      id: answer.keyId ?? answer.principalId,
      hash,
      principal: answer.principalId,
      scopeId: answer.scopeId,
      scopes: answer.scopes ?? [],
      origins: answer.origins,
      ...(answer.mode === undefined ? {} : { mode: answer.mode }),
      ...(answer.versionPin === undefined ? {} : { versionPin: answer.versionPin }),
    };
    const window = this.config.apiKeyCacheSeconds * 1000;
    if (window > 0) {
      this.cache.set(hash, { record, until: now + window });
      const hashes = this.byPrincipal.get(record.principal) ?? new Set<string>();
      hashes.add(hash);
      this.byPrincipal.set(record.principal, hashes);
    }
    return record;
  }

  /** See `ApiKeyStore.recordUse`: identity keeps the last use; the gateway writes nothing. */
  override async recordUse(): Promise<void> {}

  /** Forgets every cached record of `principalId`, so its next call asks identity (a revoke takes effect at once). */
  evictPrincipal(principalId: string): void {
    for (const hash of this.byPrincipal.get(principalId) ?? []) this.cache.delete(hash);
    this.byPrincipal.delete(principalId);
  }
}
