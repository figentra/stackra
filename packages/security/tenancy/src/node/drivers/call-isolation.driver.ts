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
 *           of a job or a schedule is written by the platform, but only when no user tenant is claimed: a tenant the
 *           actor (or one it acts for) names that differs from the scope's is refused, as is any claimed tenant when
 *           the scope is above every tenant; the scheduler's stamp, whose `scopeId` is the scope's own id, claims none; a scope the tree does
 *           not show, or shows at another path than the reference carries, is refused (`TenantScopeUnresolvedError`),
 *           and a scope above every tenant keeps no tenant. A user's, an agent's or a service's claimed scope is read through the tree, so a branch stands for its tenant
 *           (`tenantOf`): an agent or a service whose tenant differs from that of the user it acts for is refused, one
 *           with none runs in its user's (ADR 0209's amendment of 2026-11-07, condition 3), and a claimed scope the
 *           tree does not show, or one above every tenant, is refused; the isolation then runs as the tenant, never a
 *           branch id, and `work` receives that actor, so the action pipeline writes the tenant the isolation set
           (`CallDescriptor.scopeId`). A tree read that fails fails the call. Any other actor keeps its own `scopeId`,
 *           and when that tenant and the scope's tenant are both known and differ the call is refused
 *           (`TenantScopeMismatchError`), never settled by picking one; a user, an agent or a service with a tenant (an
 *           agent's or a service's own, or else its user's) whose scope the tree shows above every tenant, or does not show at that path, is
 *           refused the same way. Several granted scopes
 *           are one session, so they must all resolve alike (one tenant, all above every tenant, or all unknown to
 *           the tree) and are then treated as the first; scopes that span tenants are refused (`TenantScopeMismatchError`). A platform actor (no
 *           `scopeId`) with no scope
 *           runs with `app.tenant_id = ''`, which matches no tenant row, and no scope runs with no granted path. The
 *           tree is read in a scope session over the root label of the scope's path, because its row security shows a
 *           session only its own subtree, which hides a branch's tenant ancestor; that read touches `scope_nodes` only
 *           and runs in a savepoint rolled back after it, so the root settings never outlive it, even inside a running
 *           transaction.
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
import { actingScopeId, ActorKind, claimedScopeIds } from "@stackra/contracts";
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
   * @throws TenantScopeMismatchError when another actor's tenant and its scope's tenant are both known and differ, a
   *         user, agent or service with a tenant acts in a scope above every tenant or one the tree does not show, or
   *         several scopes span tenants.
   * @throws TenantSwitchRefusedError when a transaction is already running for another tenant than the call's.
   */
  async run<T>(
    actor: Actor,
    scope: ScopeRef | readonly ScopeRef[] | undefined,
    work: (actor?: Actor) => Promise<T>,
    options: { readonly readOnly: boolean },
  ): Promise<T> {
    const isolate = (tenant: Actor) =>
      this.database.withScope(scope ?? [], () =>
        this.isolation.withTenant(tenant, () => work(tenant)),
      );
    const open = async () => isolate(await this.actorIn(actor, scope));
    if (!this.database.em().isInTransaction()) {
      return options.readOnly ? this.database.transaction(open, { readOnly: true }) : open();
    }
    // A running transaction keeps its tenant: another actor's tenant must not replace it, so the caller (the relay, the
    // inbox) gives each actor's unit a transaction of its own. A read-only call joins the running transaction, which
    // cannot become read-only.
    const tenant = await this.actorIn(actor, scope);
    const held = await this.isolation.currentTenant();
    if (held !== "" && held !== (actingScopeId(tenant) ?? ""))
      throw TenantSwitchRefusedError.create();
    return isolate(tenant);
  }

  /**
   * The actor the isolation runs as: `actor` itself, or a copy whose `scopeId` is the tenant its scope resolves to or,
   * for an actor that claims a branch, the tenant the tree shows above that branch.
   *
   * @throws TenantScopeUnresolvedError when a job or system actor's scope is not in the scope tree.
   * @throws TenantScopeMismatchError when the tenant the actor claims (its own, or that of the user it acts for, each
   *         read through the tree) and its scope's tenant are both known and differ, an agent or a service and the
   *         user it acts for are in different tenants, a claimed scope is not in the tree or sits above every tenant,
   *         a user, agent or service with a tenant acts in a scope above every tenant or one the tree does not show,
   *         or several scopes do not all resolve alike.
   */
  private async actorIn(
    actor: Actor,
    scope: ScopeRef | readonly ScopeRef[] | undefined,
  ): Promise<Actor> {
    // An agent, or a service calling for a user, acts within the intersection of itself and the user: two tenants are
    // no intersection (ADR 0360; ADR 0209's amendment of 2026-11-07, condition 3).
    const delegating = actor.kind === ActorKind.Agent || actor.kind === ActorKind.Service;
    const scopes = scope === undefined ? [] : "path" in scope ? [scope] : scope;
    const [first] = scopes;
    // No scope is a platform or own-tenant call; with no path there is no tree to read, so the ids must be equal.
    if (first === undefined) {
      const [own, user] = [actor.scopeId, actor.onBehalfOf?.scopeId];
      if (delegating && own !== undefined && user !== undefined && own !== user)
        throw TenantScopeMismatchError.create();
      return actor;
    }
    // one read at a time: each is a savepoint on the call's one connection
    const answers: Resolved[] = [];
    for (const one of scopes) answers.push(await this.resolve(one));
    // Several granted scopes are one session: paths in two tenants, or in a tenant and above every tenant, would
    // read both through the ancestor policies (ADR 0239 decision 1), so they must all resolve alike.
    if (
      new Set(answers.map((answer) => (answer === undefined ? UNRESOLVED : answer.tenant))).size > 1
    )
      throw TenantScopeMismatchError.create();
    const [resolved] = answers;
    if (actor.kind === ActorKind.Job || actor.kind === ActorKind.System)
      return unitActor(actor, first, resolved);
    // Any other kind but a user, agent or service keeps its own `scopeId` as it is.
    if (actor.kind !== ActorKind.User && !delegating) {
      const claimed = actingScopeId(actor);
      if (claimed !== undefined && resolved?.tenant !== undefined && resolved.tenant !== claimed)
        throw TenantScopeMismatchError.create();
      return actor;
    }
    // The tenants the actor claims, read through the tree, so a branch stands for its tenant: its own and, for an
    // agent or a service, that of the user it acts for. It runs in its own or, with none, in its user's.
    // A claimed id that is one of the call's scopes reuses that scope's answer instead of reading the tree again.
    const known = new Map<string, Resolved>(scopes.map((one, index) => [one.id, answers[index]]));
    const tenantOfClaim = async (id: PublicId): Promise<PublicId<"scp">> => {
      if (!known.has(id)) return this.tenantOfId(id, first);
      const answer = known.get(id);
      if (answer?.tenant === undefined) throw TenantScopeMismatchError.create();
      return answer.tenant;
    };
    const own = actor.scopeId === undefined ? undefined : await tenantOfClaim(actor.scopeId);
    const userScopeId = delegating ? actor.onBehalfOf?.scopeId : undefined;
    const user = userScopeId === undefined ? undefined : await tenantOfClaim(userScopeId);
    if (own !== undefined && user !== undefined && own !== user)
      throw TenantScopeMismatchError.create();
    const claimed = own ?? user;
    // A tenant user, agent or service in a scope above every tenant, or in one the tree does not show (a forged path
    // such as its own id with `platform`), would keep its tenant while its scope paths cover other tenants' rows: its
    // scope must be shown inside a tenant. A platform one (no tenant) stays a platform call (ADR 0239 decision 1).
    if (claimed !== undefined && resolved?.tenant === undefined)
      throw TenantScopeMismatchError.create();
    if (claimed !== undefined && resolved?.tenant !== undefined && resolved.tenant !== claimed)
      throw TenantScopeMismatchError.create();
    // `withTenant` sets the tenant itself, never a branch id the actor claims.
    return claimed === undefined || claimed === actingScopeId(actor)
      ? actor
      : Object.freeze({ ...actor, scopeId: claimed });
  }

  /**
   * The tenant of the scope node `id`, read in the tree under the root label of `at`.
   *
   * @throws TenantScopeMismatchError when the tree does not show the node or it sits above every tenant.
   */
  private async tenantOfId(id: PublicId, at: ScopeRef): Promise<PublicId<"scp">> {
    const tenant = await this.inTree(at, async () => {
      const node = await this.tree.node(id as PublicId<"scp">);
      return node === undefined ? undefined : tenantOf(this.tree, { id: node.id, path: node.path });
    });
    if (tenant === undefined) throw TenantScopeMismatchError.create();
    return tenant;
  }

  /**
   * The tenant of `scope` (`undefined` above every tenant), or `undefined` itself when the tree does not show the node
   * at the reference's path.
   */
  private resolve(scope: ScopeRef): Promise<Resolved> {
    return this.inTree(scope, async () => {
      const node = await this.tree.node(scope.id);
      return node?.path === scope.path ? { tenant: await tenantOf(this.tree, scope) } : undefined;
    });
  }

  /**
   * `read`'s answer, run in a scope session over the root label of `at`'s path, which grants the whole tree for this
   * one read of `scope_nodes`. A failing read throws, so the call never runs on a tree it could not read.
   *
   * The read runs in a savepoint (a transaction of its own outside one) that is rolled back once it has read, so the
   * root-label scope settings it needs never outlive it: inside a running transaction a released savepoint would keep
   * them until the outer transaction ends, and a caller that catches a later refusal would read the whole tree.
   */
  private async inTree<T>(at: ScopeRef, read: () => Promise<T>): Promise<T> {
    const root = { id: at.id, path: at.path.split(".")[0] ?? at.path };
    let answer: { readonly value: T } | undefined;
    try {
      await this.database.withScope(root, async () => {
        answer = { value: await read() };
        throw ROLL_BACK;
      });
    } catch (error) {
      if (answer === undefined) throw error;
    }
    if (answer === undefined) throw new Error("the scope tree read did not run");
    return answer.value;
  }
}

/** What `resolve` answers: the scope's tenant (`undefined` above every tenant), or `undefined` for an unknown scope. */
type Resolved = { readonly tenant: PublicId<"scp"> | undefined } | undefined;

/** Marks an unknown scope among several, so it never counts as the same tenant as a known one. */
const UNRESOLVED = Symbol("a scope the tree does not show");

/** Thrown inside the tree read to roll its savepoint back; never leaves `resolve`. */
const ROLL_BACK = Symbol("roll back the tree read");

/**
 * The actor a job or system call runs as in `scope`: it takes the tenant its scope resolves to only when no user
 * tenant is claimed (the scheduler's stamp names the schedule's own scope id, which claims none). A claimed tenant
 * that differs from the scope's, or any claimed tenant when the scope is above every tenant, is refused.
 *
 * @throws TenantScopeUnresolvedError when the tree does not show the scope.
 * @throws TenantScopeMismatchError when a claimed tenant differs from the scope's.
 */
function unitActor(actor: Actor, scope: ScopeRef, resolved: Resolved): Actor {
  if (resolved === undefined) throw TenantScopeUnresolvedError.create();
  const { tenant } = resolved;
  for (const claimed of claimedScopeIds(actor))
    if (claimed !== scope.id && claimed !== tenant) throw TenantScopeMismatchError.create();
  return tenant === undefined || tenant === actor.scopeId
    ? actor
    : Object.freeze({ ...actor, scopeId: tenant });
}
