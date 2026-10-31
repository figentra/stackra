/**
 * Stackra file contract:
 * Purpose: `CallIsolationDriver`, the `CallIsolation` of the action pipeline and of every background unit: it runs the
 *          work in one transaction whose `app.scope_*` settings come from `Database.withScope` and whose
 *          `app.tenant_id` comes from `TenantIsolationService.withTenant`, both `set_config(..., true)`, so the
 *          settings end with the transaction and never reach another caller on a pooled connection.
 * Boundary: a platform driver over the `Database` port and `TenantIsolationService`; the tenant comes only from the
 *           verified `Actor` and the scope from the call or the stored unit (ADR 0098), never from a body or a header.
 *           A platform actor (no `scopeId`) runs with `app.tenant_id = ''`, which matches no tenant row, and no scope
 *           runs with no granted path. A read-only unit opens one read-only transaction first and the two settings run
 *           inside it (a write there fails with `25006`); a writable one lets `withScope` open the transaction and
 *           `withTenant` run in a savepoint of it, so a unit of work inside the work is a savepoint too and the whole
 *           unit commits once.
 *           Inside a transaction that already runs for another tenant it refuses (`TenantSwitchRefusedError`) rather
 *           than replace the tenant: the relay and the inbox give each unit a transaction of its own. It is the one place, with `TenantIsolationService` and the database drivers'
 *           `withScope`, that writes an `app.*` setting (ADR 0495 decision 3; `pnpm validate` refuses the rest).
 * Runtime: node
 * Governing contract: ADR 0495 (decisions 1 to 3); ADR 0239 (decision 1); ADR 0210 (decisions 3 and 7); ADR 0327
 *                     (decisions 8 and 9); `.agents/rules/tenancy.md` (point 1).
 */
import { CallIsolation } from "@stackra/actions/contracts";
import { Driver } from "@stackra/container";
import type { Actor, ScopeRef } from "@stackra/contracts";
import type { Database } from "@stackra/database";

import { TenantSwitchRefusedError } from "#core/errors/tenant-switch-refused.error";
import type { TenantIsolationService } from "#node/services/tenant-isolation.service";

/**
 * Runs work in the caller's isolation transaction.
 *
 * @example
 * const driver = new CallIsolationDriver(database, isolation);
 * await driver.run(actor, scope, () => orders.list(), { readOnly: true });
 */
export class CallIsolationDriver extends Driver(CallIsolation) {
  /** The service's database. */
  private readonly database: Database;

  /** Sets the tenant. */
  private readonly isolation: TenantIsolationService;

  /**
   * @param database - the connected database.
   * @param isolation - the tenant half of the isolation.
   */
  constructor(database: Database, isolation: TenantIsolationService) {
    super();
    this.database = database;
    this.isolation = isolation;
  }

  /**
   * Implements `CallIsolation.run`, documented there.
   *
   * @throws TypeError when `actor.scopeId` is not a tenant id or a scope path is not an `ltree` path.
   * @throws TenantSwitchRefusedError when a transaction is already running for another tenant than the actor's.
   */
  async run<T>(
    actor: Actor,
    scope: ScopeRef | readonly ScopeRef[] | undefined,
    work: () => Promise<T>,
    options: { readonly readOnly: boolean },
  ): Promise<T> {
    const isolated = () =>
      this.database.withScope(scope ?? [], () => this.isolation.withTenant(actor, work));
    if (!this.database.em().isInTransaction()) {
      return options.readOnly
        ? this.database.transaction(isolated, { readOnly: true })
        : isolated();
    }
    // A running transaction keeps its tenant: another actor's tenant must not replace it, so the caller (the relay, the
    // inbox) gives each actor's unit a transaction of its own. A read-only call joins the running transaction, which
    // cannot become read-only.
    const held = await this.isolation.currentTenant();
    if (held !== "" && held !== (actor.scopeId ?? "")) throw TenantSwitchRefusedError.create();
    return isolated();
  }
}
