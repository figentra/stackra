/**
 * Stackra file contract:
 * Purpose: the memory driver of the `CronScopes` port: the scopes a test or a single process set on it, none until
 *          then.
 * Boundary: holds plain `ScopeRef`s in process memory; a deployment with scopes binds the driver of the package that
 *           owns its scheduling level instead (@stackra/tenancy). With no scope set, a per-scope cron runs nowhere.
 * Runtime: isomorphic
 * Governing contract: ADR 0148 (decision 5); ADR 0266 (memory drivers first); ADR 0323 (`ScopeRef`).
 */
import { Driver } from "@stackra/container";
import type { ScopeRef } from "@stackra/contracts";

import { CronScopes } from "#contracts/index";

/**
 * Lists the scopes set on it.
 *
 * @example
 * const scopes = new MemoryCronScopesDriver();
 * scopes.scopes = [{ id: "scp_1", path: "platform.acme" }];
 */
export class MemoryCronScopesDriver extends Driver(CronScopes) {
  /** The scopes a per-scope cron runs in. */
  scopes: readonly ScopeRef[] = [];

  /** See `CronScopes.list`. */
  list(): Promise<readonly ScopeRef[]> {
    return Promise.resolve([...this.scopes]);
  }
}
