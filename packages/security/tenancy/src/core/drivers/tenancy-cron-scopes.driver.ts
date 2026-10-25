/**
 * Stackra file contract:
 * Purpose: `TenancyCronScopesDriver`, tenancy's driver of @stackra/scheduler's `CronScopes` port: every tenant-level
 *          node of the scope tree, child tenants included, so a per-scope cron runs once for every tenant.
 * Boundary: a `CronScopes` driver over the `ScopeTree` port; it reads the nodes below the root at
 *           `ScopeConfig.root` and keeps those at `TenancyScopes.Tenant`, as plain `ScopeRef`s (id and path) in path
 *           order. The Postgres tree shows what the tick's scope session may see, so the scheduler lists from the
 *           root's session; a tree that shows no root lists none. A host binds it in place of the memory driver.
 * Runtime: isomorphic
 * Governing contract: ADR 0148 (decision 5: per-scope crons); ADR 0327 (decision 8: tenancy is a scope consumer); ADR
 *                     0323 (`ScopeRef`); ADR 0142 (drivers behind a port).
 */
import { Driver } from "@stackra/container";
import type { ScopeRef } from "@stackra/contracts";
import { CronScopes } from "@stackra/scheduler/contracts";
import type { ScopeConfig } from "@stackra/scope";
import type { ScopeTree } from "@stackra/scope/contracts";

import { TenancyScopes } from "#core/enums/tenancy-scopes.enum";

/**
 * Lists every tenant for a per-scope cron.
 *
 * @example
 * await new TenancyCronScopesDriver(tree, config).list(); // [{ id: "scp_…", path: "platform.acme.shop_eu" }, …]
 */
export class TenancyCronScopesDriver extends Driver(CronScopes) {
  /** Where the tenants are read. */
  private readonly tree: ScopeTree;

  /** Names the root's path. */
  private readonly config: ScopeConfig;

  /**
   * @param tree - the scope tree.
   * @param config - the deployment's levels and root.
   */
  constructor(tree: ScopeTree, config: ScopeConfig) {
    super();
    this.tree = tree;
    this.config = config;
  }

  /** See `CronScopes.list`: the tenant nodes below the root. */
  async list(): Promise<readonly ScopeRef[]> {
    const root = await this.tree.byPath(this.config.root);
    if (root === undefined) return [];
    const nodes = await this.tree.descendants(root);
    return nodes
      .filter((node) => node.level === TenancyScopes.Tenant)
      .map(({ id, path }) => ({ id, path }));
  }
}
