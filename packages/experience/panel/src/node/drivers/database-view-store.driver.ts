/**
 * Stackra file contract:
 * Purpose: `DatabaseViewStoreDriver`, the `database` driver of the `ViewStore` port: saved views kept in
 *          `panel.stored_views` for the viewer of the running call.
 * Boundary: implements the port only, for the actor and scope of the running call (`ContextStorage`); outside a call it
 *           throws. Every read and write runs in `withTenant(actor, ...)`, so the forced tenant policy scopes it. `list`
 *           returns the viewer's own views, the scope's shared views and the role copies of the roles the viewer holds at
 *           the call's scope (`RolesAtNode`), by name. `save` refuses undeclared keys against the resource's registered
 *           table (`unknownViewKeys`, `view_key_unknown`), refuses sharing without `panel.view.share`, and refuses a
 *           change to a view the viewer does not own; a new view is minted with the viewer as owner whatever id or owner
 *           it carried, and a change passes its version as `expectedVersion`, so a view changed since is refused with
 *           `StaleVersionError`. `remove` removes the viewer's own view only. The generated wiring loads this driver
 *           lazily, so it never reaches a browser bundle.
 * Runtime: node
 * Governing contract: ADR 0271 (decisions 3, 4 and 8); ADR 0307 (rule 9); ADR 0359 (decision 14); ADR 0239 (tenant
 *                     equality); ADR 0294 (decisions 15 and 16).
 */
import type { ExtensionContext } from "@stackra/actions";
import type { ContextStorage } from "@stackra/actions/contracts";
import { Driver } from "@stackra/container";
import { ForbiddenError } from "@stackra/errors";
import type { PolicyDecisionPointService } from "@stackra/iam";
import type { RolesAtNode } from "@stackra/iam/contracts";
import type { TenantIsolationService } from "@stackra/tenancy/node";

import { ViewSharing } from "#core/enums/view-sharing.enum";
import { ViewKeyUnknownError } from "#core/errors/view-key-unknown.error";
import { resourceTreeOf } from "#core/functions/resource-tree-of.function";
import { unknownViewKeys } from "#core/functions/unknown-view-keys.function";
import { ViewStore } from "#core/ports/view-store.port";
import { SavedView } from "#core/schemas/saved-view.schema";
import { ViewPermissions } from "#node/access/view.permissions";
import type { StoredView } from "#node/models/stored-view.model";
import type { StoredViewService } from "#node/services/stored-view.service";

/** The stored columns of `view`, nulls for what it leaves out. */
const columnsOf = (view: SavedView) => ({
  resource: view.resource,
  name: view.name,
  sharing: view.sharing,
  role: view.sharing === ViewSharing.Role ? (view.role ?? null) : null,
  layout: view.layout,
  layoutBy: view.layoutBy ?? null,
  filter: view.filter,
  sort: view.sort ?? null,
  columns: view.columns ?? null,
  group: view.group ?? null,
  totals: view.totals,
});

/** The saved view of a stored row. */
const viewOf = (row: StoredView): SavedView =>
  SavedView.create({
    id: row.id,
    resource: row.resource,
    name: row.name,
    owner: row.owner,
    sharing: row.sharing,
    version: row.version,
    layout: row.layout,
    filter: row.filter,
    totals: row.totals,
    ...(row.role === null ? {} : { role: row.role }),
    ...(row.layoutBy === null ? {} : { layoutBy: row.layoutBy }),
    ...(row.sort === null || row.sort === undefined ? {} : { sort: row.sort }),
    ...(row.columns === null ? {} : { columns: row.columns }),
    ...(row.group === null || row.group === undefined ? {} : { group: row.group }),
  });

/**
 * Keeps saved views in Postgres.
 *
 * @example
 * // generated wiring: { port: ViewStore, candidates: { database: … }, deps: { database: [StoredViewService, TenantIsolationService, ContextStorage, PolicyDecisionPointService, RolesAtNode] } }
 */
export class DatabaseViewStoreDriver extends Driver(ViewStore) {
  /** The stored views. */
  private readonly views: StoredViewService;

  /** Sets the viewer's tenant on each read and write. */
  private readonly tenancy: TenantIsolationService;

  /** The running call, for the viewer and its scope. */
  private readonly storage: ContextStorage;

  /** Decides `panel.view.share`. */
  private readonly policy: PolicyDecisionPointService;

  /** The roles the viewer holds, for its role copies. */
  private readonly roles: RolesAtNode;

  /**
   * @param views - the stored views, tenant-scoped by their policy.
   * @param tenancy - tenant isolation, for the viewer's tenant setting.
   * @param storage - the running call's context.
   * @param policy - the policy decision point.
   * @param roles - the roles a principal holds at a scope node.
   */
  constructor(
    views: StoredViewService,
    tenancy: TenantIsolationService,
    storage: ContextStorage,
    policy: PolicyDecisionPointService,
    roles: RolesAtNode,
  ) {
    super();
    this.views = views;
    this.tenancy = tenancy;
    this.storage = storage;
    this.policy = policy;
    this.roles = roles;
  }

  /** Implements `ViewStore.list`, documented there. */
  async list(resource: string): Promise<readonly SavedView[]> {
    const { actor, scope } = this.call();
    const held = scope === undefined ? new Set<string>() : await this.roles.of(actor, scope);
    const rows = await this.tenancy.withTenant(actor, () =>
      this.views.find(
        {
          resource,
          $or: [
            { owner: actor.id },
            { sharing: ViewSharing.Scope },
            { sharing: ViewSharing.Role, role: { $in: [...held] } },
          ],
        },
        { orderBy: { name: "asc" } },
      ),
    );
    return rows.map(viewOf);
  }

  /**
   * Implements `ViewStore.save`, documented there.
   *
   * @throws ViewKeyUnknownError when the view names an undeclared key.
   * @throws ForbiddenError when the viewer may not share, or the view is someone else's.
   * @throws StaleVersionError when the stored view's version is not the view's.
   */
  async save(view: SavedView): Promise<SavedView> {
    const { actor, scope } = this.call();
    const keys = unknownViewKeys(view, resourceTreeOf(view.resource).table);
    if (keys.length > 0) throw ViewKeyUnknownError.create({ resource: view.resource, keys });
    if (
      view.sharing !== ViewSharing.Private &&
      !(await this.policy.check(actor, ViewPermissions.share, scope === undefined ? {} : { scope }))
    )
      throw ForbiddenError.create();
    const row = await this.tenancy.withTenant(actor, async () => {
      const stored = await this.views.findOne({ id: view.id as StoredView["id"] });
      // reason: the jsonb columns hold the saved view's own shapes, which the ORM's entity-data type widens
      if (stored === null)
        return this.views.insert({ ...columnsOf(view), owner: actor.id } as never);
      if (stored.owner !== actor.id) throw ForbiddenError.create();
      // reason: as above, the jsonb shapes against the ORM's entity-data type
      return this.views.update({ id: stored.id }, columnsOf(view) as never, {
        expectedVersion: view.version,
      });
    });
    return viewOf(row);
  }

  /** Implements `ViewStore.remove`, documented there. */
  async remove(id: string): Promise<void> {
    const { actor } = this.call();
    await this.tenancy.withTenant(actor, () =>
      this.views.delete({ id: id as StoredView["id"], owner: actor.id }),
    );
  }

  /**
   * The running call's context.
   *
   * @throws TypeError outside a call: a view belongs to a viewer.
   */
  private call(): ExtensionContext {
    const context = this.storage.current() as ExtensionContext | undefined;
    if (context === undefined) throw new TypeError("ViewStore needs a running call: no viewer");
    return context;
  }
}
