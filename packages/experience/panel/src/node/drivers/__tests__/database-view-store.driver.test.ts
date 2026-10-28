/**
 * Stackra file contract:
 * Purpose: unit tests of `DatabaseViewStoreDriver`: list asks for the viewer's own, the scope's and its roles' views
 *          under the viewer's tenant; save inserts a new view owned by the viewer, updates the viewer's own view with its
 *          version as `expectedVersion`, and refuses undeclared keys, sharing without `panel.view.share` and someone
 *          else's view; remove deletes the viewer's own view only; every method throws outside a call.
 * Boundary: test only; the service, tenant isolation, the call context, the policy and the roles are in-memory stand-ins
 *           of the calls the driver makes, so no Postgres runs.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0271 (decisions 3, 4 and 8); ADR 0307 (rule 9).
 */
import type { ContextStorage } from "@stackra/actions/contracts";
import { ActorKind, Realm, SortDirection } from "@stackra/contracts";
import type { Actor } from "@stackra/contracts";
import { ForbiddenError, isRefusal } from "@stackra/errors";
import type { PolicyDecisionPointService } from "@stackra/iam";
import type { RolesAtNode } from "@stackra/iam/contracts";
import type { TenantIsolationService } from "@stackra/tenancy/node";
import { afterAll, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { Count } from "#core/enums/count.enum";
import { ViewKeyUnknownError } from "#core/errors/view-key-unknown.error";
import { registerResources } from "#core/functions/register-resources.function";
import { ViewStore } from "#core/ports/view-store.port";
import { SavedView } from "#core/schemas/saved-view.schema";
import type { ResourceTree } from "#core/types/resource-tree.type";
import { DatabaseViewStoreDriver } from "#node/drivers/database-view-store.driver";
import type { StoredView } from "#node/models/stored-view.model";
import type { StoredViewService } from "#node/services/stored-view.service";

const ACTOR: Actor = {
  kind: ActorKind.User,
  id: "usr_ana",
  realm: Realm.Staff,
  scopeId: "scp_acme",
};
const SCOPE = { id: "scp_acme", path: "platform.acme" };

const unregister = registerResources({
  "orders.order": {
    table: {
      columns: [
        { kind: "value", key: "number", sortable: true },
        { kind: "value", key: "status" },
      ],
      filters: [{ kind: "value", key: "status" }],
      count: Count.Estimated,
    },
  } as unknown as ResourceTree,
});
afterAll(unregister);

/** A stored row of `owner`. */
const rowOf = (owner: string, version = 2): StoredView =>
  ({
    id: "view_1",
    resource: "orders.order",
    name: "Open",
    owner,
    sharing: "private",
    role: null,
    version,
    layout: "table",
    layoutBy: null,
    filter: { status: "open" },
    sort: null,
    columns: ["number"],
    group: null,
    totals: [],
  }) as unknown as StoredView;

/** The driver over stand-ins; `stored` is what `findOne` finds, `share` what the policy answers. */
function driverWith(
  options: {
    readonly stored?: StoredView | null;
    readonly share?: boolean;
    readonly inCall?: boolean;
  } = {},
) {
  const views = {
    find: vi.fn(async () => [rowOf("usr_ana")]),
    findOne: vi.fn(async () => options.stored ?? null),
    insert: vi.fn(async (data: object) => ({ ...rowOf("usr_ana", 1), ...data })),
    update: vi.fn(async (_where: object, data: object) => ({ ...rowOf("usr_ana", 3), ...data })),
    delete: vi.fn(async () => 1),
  };
  const tenancy = { withTenant: vi.fn(async (_actor: Actor, work: () => unknown) => work()) };
  const storage = {
    current: () => (options.inCall === false ? undefined : { actor: ACTOR, scope: SCOPE }),
  };
  const policy = { check: vi.fn(async () => options.share ?? false) };
  const roles = { of: vi.fn(async () => new Set(["orders.clerk"])) };
  const driver = new DatabaseViewStoreDriver(
    views as unknown as StoredViewService,
    tenancy as unknown as TenantIsolationService,
    storage as unknown as ContextStorage,
    policy as unknown as PolicyDecisionPointService,
    roles as unknown as RolesAtNode,
  );
  return { driver, views, tenancy, policy, roles };
}

/** A saved view of declared keys. */
const view = (values: Partial<SavedView> = {}): SavedView =>
  SavedView.create({
    id: "view_1",
    resource: "orders.order",
    name: "Open",
    owner: "usr_someone",
    filter: { status: "open" },
    sort: { key: "number", direction: SortDirection.Asc },
    columns: ["number", "status"],
    totals: [],
    ...values,
  } as never);

describe("DatabaseViewStoreDriver", () => {
  it("is the ViewStore driver", () => {
    expect(driverWith().driver).toBeInstanceOf(ViewStore);
  });

  it("lists the viewer's own, the scope's and its roles' views under its tenant", async () => {
    const { driver, views, tenancy, roles } = driverWith();
    const listed = await driver.list("orders.order");
    expect(roles.of).toHaveBeenCalledWith(ACTOR, SCOPE);
    expect(tenancy.withTenant).toHaveBeenCalledWith(ACTOR, expect.any(Function));
    expect(views.find).toHaveBeenCalledWith(
      {
        resource: "orders.order",
        $or: [
          { owner: "usr_ana" },
          { sharing: "scope" },
          { sharing: "role", role: { $in: ["orders.clerk"] } },
        ],
      },
      { orderBy: { name: "asc" } },
    );
    expect(listed[0]).toBeInstanceOf(SavedView);
    expect(listed[0]).toMatchObject({ id: "view_1", version: 2, columns: ["number"] });
  });

  it("inserts a new view owned by the viewer", async () => {
    const { driver, views } = driverWith({ stored: null });
    const saved = await driver.save(view());
    expect(views.insert).toHaveBeenCalledWith(expect.objectContaining({ owner: "usr_ana" }));
    expect(saved.owner).toBe("usr_ana");
    expect(saved.version).toBe(1);
  });

  it("updates the viewer's own view with its version as expectedVersion", async () => {
    const { driver, views } = driverWith({ stored: rowOf("usr_ana") });
    const saved = await driver.save(view({ version: 2 }));
    expect(views.update).toHaveBeenCalledWith(
      { id: "view_1" },
      expect.objectContaining({ name: "Open" }),
      { expectedVersion: 2 },
    );
    expect(saved.version).toBe(3);
  });

  it("refuses undeclared keys, sharing without the permission and someone else's view", async () => {
    await expect(driverWith().driver.save(view({ columns: ["legacy"] }))).rejects.toSatisfy(
      (error: unknown) => isRefusal(error, ViewKeyUnknownError),
    );
    const { driver, policy } = driverWith({ share: false });
    await expect(driver.save(view({ sharing: "scope" }))).rejects.toSatisfy((error: unknown) =>
      isRefusal(error, ForbiddenError),
    );
    expect(policy.check).toHaveBeenCalledWith(ACTOR, expect.anything(), { scope: SCOPE });
    await expect(
      driverWith({ stored: rowOf("usr_bob"), share: true }).driver.save(view({ sharing: "scope" })),
    ).rejects.toSatisfy((error: unknown) => isRefusal(error, ForbiddenError));
  });

  it("removes the viewer's own view only", async () => {
    const { driver, views } = driverWith();
    await driver.remove("view_1");
    expect(views.delete).toHaveBeenCalledWith({ id: "view_1", owner: "usr_ana" });
  });

  it("throws outside a call", async () => {
    await expect(driverWith({ inCall: false }).driver.list("orders.order")).rejects.toThrow(
      TypeError,
    );
  });
});
