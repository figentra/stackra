/**
 * Stackra file contract:
 * Purpose: `MemoryTenantTokensDriver`, a `TenantTokens` held in memory, for tests and local runs.
 * Boundary: process-local and unsynchronised; never a production store.
 * Runtime: isomorphic
 * Governing contract: ADR 0263 (a driver is named by its class: `memory`); ADR 0266 (memory first).
 */
import { Driver } from "@stackra/container";

import { TenantTokens } from "#core/ports/tenant-tokens.port";
import type { TenantToken } from "#core/types/tenant-token.type";

/**
 * Tenant tokens held in memory.
 *
 * @example
 * const store = new MemoryTenantTokensDriver();
 */
export class MemoryTenantTokensDriver extends Driver(TenantTokens) {
  /** Hash to token. */
  private readonly tokens = new Map<string, TenantToken>();

  /** Records `token` under `hash`. */
  save(hash: string, token: TenantToken): Promise<void> {
    this.tokens.set(hash, Object.freeze({ ...token }));
    return Promise.resolve();
  }

  /** The token under `hash`, or `undefined`. */
  find(hash: string): Promise<TenantToken | undefined> {
    return Promise.resolve(this.tokens.get(hash));
  }

  /** Forgets the token under `hash`. */
  delete(hash: string): Promise<void> {
    this.tokens.delete(hash);
    return Promise.resolve();
  }
}
