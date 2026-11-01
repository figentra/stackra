/**
 * Stackra file contract:
 * Purpose: `CallIsolationDriver`, the `CallIsolation` of the action pipeline and of every background unit: it runs the
 *          work in one transaction whose `app.scope_*` settings come from `Database.withScope` and whose
 *          `app.tenant_id` comes from `TenantIsolationService.withTenant`, both `set_config(..., true)`, so the
 *          settings end with the transaction and never reach another caller on a pooled connection.
 * Boundary: a platform driver over the `Database` port, `TenantIsolationService` and the `ScopeTree`; the tenant comes
 *           only from the verified `Actor` and the scope from the call or the stored unit (ADR 0098), never from a
 *           body or a header. For one scope the tenant resolves before the transaction opens: a `job` or `system`
 *           actor takes the tenant of its scope (`tenantOf`; a branch resolves to its parent tenant), because the scope
 *           of a job or a schedule is written by the platform, whatever `actor.scopeId` says; a scope the tree does
 *           not show, or shows at another path than the reference carries, is refused (`TenantScopeUnresolvedError`),
 *           and a scope above every tenant keeps the actor's own `scopeId`. Any other actor keeps its own `scopeId`,
 *           and when that tenant and the scope's tenant are both known and differ the call is refused
 *           (`TenantScopeMismatchError`), never settled by picking one. A platform actor (no `scopeId`) with no scope
 *           runs with `app.tenant_id = ''`, which matches no tenant row, and no scope runs with no granted path. The
 *           tree is read in a scope session over the root label of the scope's path, because its row security shows a
 *           session only its own subtree, which hides a branch's tenant ancestor; that read touches `scope_nodes` only
 *           and the call's own `withScope` follows and replaces the session.
 *           A read-only unit opens one read-only transaction first and the two settings run inside it (a write there
 *           fails with `25006`); a writable one lets `withScope` open the transaction and `withTenant` run in a
 *           savepoint of it, so a unit of work inside the work is a savepoint too and the whole unit commits once.
 *           Inside a transaction that already runs for another tenant it refuses (`TenantSwitchRefusedError`) rather
 *           than replace the tenant: the relay and the inbox give each unit a transaction of its own. It is the one
 *           place, with `TenantIsolationService` and the database drivers' `withScope`, that writes an `app.*` setting
 *           (ADR 0495 decision 3; `pnpm validate` refuses the rest).
 * Runtime: node
 * Governing contract: ADR 0495 (decisions 1 to 3 and the note of 2026-11-01); ADR 0239 (decision 1); ADR 0210
 *                     (decisions 3 and 7); ADR 0327 (decisions 8 and 9); `.agents/rules/tenancy.md` (point 1).
 */
import { CallIsolation } from "@stackra/actions/contracts";
import { Driver } from "@stackra/container";
import { ActorKind } from "@stackra/contracts";
import type { Actor, PublicId, ScopeRef } from "@stackra/contracts";
import type { Database } from "@stackra/database";
import type { ScopeTree } from "@stackra/scope/contracts";

import { TenantScopeMismatchError } from "#core/errors/tenant-scope-mismatch.error";
import { TenantScopeUnresolvedError } from "#core/errors/tenant-scope-unresolved.error";
import { TenantSwitchRefusedError } from "#core/errors/tenant-switch-refused.error";
import { tenantOf } from "#core/functions/tenant-of.function";
import type { TenantIsolationService } from "#node/services/tenant-isolation.service";

/**
 * Runs work in the caller's isolation transaction.
 *
 * @example
 * const driver = new CallIsolationDriver(database, isolation, tree);
 * await driver.run(actor, scope, () => orders.list(), { readOnly: true });
 */
export class CallIsolationDriver extends Driver(CallIsolation) {
  /** The service's database. */
  private readonly database: Database;

  /** Sets the tenant. */
  private readonly isolation: TenantIsolationService;

  /** Answers which tenant a scope belongs to. */
  private readonly tree: ScopeTree;

  /**
   * @param database - the connected database.
   * @param isolation - the tenant half of the isolation.
   * @param tree - the scope tree a scope's tenant is read from.
   */
  constructor(database: Database, isolation: TenantIsolationService, tree: ScopeTree) {
    super();
    this.database = database;
    this.isolation = isolation;
    this.tree = tree;
  }

  /**
   * Implements `CallIsolation.run`, documented there.
   *
   * @throws TypeError when `actor.scopeId` is not a tenant id or a scope path is not an `ltree` path.
   * @throws TenantScopeUnresolvedError when a job or system actor's scope is not in the scope tree.
   * @throws TenantScopeMismatchError when another actor's tenant and its scope's tenant are both known and differ.
   * @throws TenantSwitchRefusedError when a transaction is already running for another tenant than the call's.
   */
  async run<T>(
    actor: Actor,
    scope: ScopeRef | readonly ScopeRef[] | undefined,
    work: () => Promise<T>,
    options: { readonly readOnly: boolean },
  ): Promise<T> {
    const isolate = (tenant: Actor) =>
      this.database.withScope(scope ?? [], () => this.isolation.withTenant(tenant, work));
    const open = async () => isolate(await this.actorIn(actor, scope));
    if (!this.database.em().isInTransaction()) {
      return options.readOnly ? this.database.transaction(open, { readOnly: true }) : open();
    }
    // A running transaction keeps its tenant: another actor's tenant must not replace it, so the caller (the relay, the
    // inbox) gives each actor's unit a transaction of its own. A read-only call joins the running transaction, which
    // cannot become read-only.
    const tenant = await this.actorIn(actor, scope);
    const held = await this.isolation.currentTenant();
    if (held !== "" && held !== (tenant.scopeId ?? "")) throw TenantSwitchRefusedError.create();
    return isolate(tenant);
  }

  /**
   * The actor the isolation runs as: `actor` itself, or a copy whose `scopeId` is the tenant its scope resolves to.
   *
   * @throws TenantScopeUnresolvedError when a job or system actor's scope is not in the scope tree.
   * @throws TenantScopeMismatchError when another actor's tenant and its scope's tenant are both known and differ.
   */
  private async actorIn(
    actor: Actor,
    scope: ScopeRef | readonly ScopeRef[] | undefined,
  ): Promise<Actor> {
    // Several granted scopes name no one tenant, so they derive nothing; no scope is a platform or own-tenant call.
    if (scope === undefined || !("path" in scope)) return actor;
    const resolved = await this.resolve(scope);
    if (actor.kind === ActorKind.Job || actor.kind === ActorKind.System) {
      if (resolved === undefined) throw TenantScopeUnresolvedError.create();
      return resolved.tenant === undefined || resolved.tenant === actor.scopeId
        ? actor
        : Object.freeze({ ...actor, scopeId: resolved.tenant });
    }
    if (
      actor.scopeId !== undefined &&
      resolved?.tenant !== undefined &&
      resolved.tenant !== actor.scopeId
    )
      throw TenantScopeMismatchError.create();
    return actor;
  }

  /**
   * The tenant of `scope` (`undefined` above every tenant), or `undefined` itself when the tree does not show the node
   * at the reference's path.
   */
  private resolve(
    scope: ScopeRef,
  ): Promise<{ readonly tenant: PublicId<"scp"> | undefined } | undefined> {
    // The root label grants the whole tree for this one read of `scope_nodes`; the call's own scope session follows.
    const root = { id: scope.id, path: scope.path.split(".")[0] ?? scope.path };
    return this.database.withScope(root, async () => {
      const node = await this.tree.node(scope.id);
      return node?.path === scope.path ? { tenant: await tenantOf(this.tree, scope) } : undefined;
    });
  }
}
