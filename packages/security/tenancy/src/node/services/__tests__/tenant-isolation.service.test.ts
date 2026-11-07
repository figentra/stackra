/**
 * Stackra file contract:
 * Purpose: unit tests of `TenantIsolationService`: `withTenant` runs the work in a transaction after one parameterised
 *          `set_config('app.tenant_id', …, true)` with the actor's tenant, or `''` for an actor with none; new
 *          `BelongsToTenant` rows inside take that tenant; an agent or a service sets its own tenant, else its user's
 *          (a platform agent `''`, a job acting for a user `''`); the work's result and refusal pass through; a tenant id that
 *          is not a scope node's id is refused before any transaction opens; inside a running transaction the
 *          enclosing tenant is set back after the work, its writes flushed first, and at the top level nothing is.
 * Boundary: test only; a fake `Database` records the transaction and the statement, so no database runs.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0239; ADR 0210 (decision 3); ADR 0160.
 */
import { Service } from "@stackra/container";
import { ActorKind, Realm } from "@stackra/contracts";
import type { Actor } from "@stackra/contracts";
import type { Database } from "@stackra/database";
import { HasPublicId, Model } from "@stackra/model";
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { TenantIsolationService } from "#node/services/tenant-isolation.service";
import { BelongsToTenant } from "#node/traits/belongs-to-tenant.trait";

const TENANT = "scp_01j9z3k4m5n6p7q8r9s0t1v2wa";

/** A tenant-owned model. */
class Ticket extends Model.with(HasPublicId("tkt"), BelongsToTenant) {}

/** A job acting in `tenantId`, or in none. */
const jobIn = (tenantId?: Actor["scopeId"]): Actor => ({
  kind: ActorKind.Job,
  id: "job_01j9z3k4m5n6p7q8r9s0t1v2w3",
  ...(tenantId === undefined ? {} : { scopeId: tenantId }),
});

/** A recording database whose transaction runs the work. */
function setUp(nested = false) {
  const execute = vi.fn(async () => []);
  const flush = vi.fn(async () => undefined);
  const transaction = vi.fn(async (work: () => Promise<unknown>) => work());
  const database = {
    em: () => ({ execute, flush, isInTransaction: () => nested }),
    transaction,
  } as unknown as Database;
  return { execute, flush, transaction, service: new TenantIsolationService(database) };
}

describe(TenantIsolationService, () => {
  it("is a service", () => {
    expect(setUp().service).toBeInstanceOf(Service);
  });

  it("reads the running transaction's tenant, '' when it has none", async () => {
    const { execute, service } = setUp();
    execute.mockResolvedValueOnce([{ tenant: TENANT }] as never);
    await expect(service.currentTenant()).resolves.toBe(TENANT);
    expect(execute).toHaveBeenCalledWith("select current_setting(?, true) as tenant", [
      "app.tenant_id",
    ]);
    execute.mockResolvedValueOnce([{ tenant: null }] as never);
    await expect(service.currentTenant()).resolves.toBe("");
  });

  it("sets app.tenant_id to the actor's tenant inside a transaction, and new rows take it", async () => {
    const { execute, transaction, service } = setUp();
    const ticket = await service.withTenant(jobIn(TENANT), async () => new Ticket());
    expect(transaction).toHaveBeenCalledTimes(1);
    expect(execute).toHaveBeenCalledWith("select set_config(?, ?, true)", [
      "app.tenant_id",
      TENANT,
    ]);
    expect(ticket.tenantId).toBe(TENANT);
  });

  it("sets '' for an actor with no tenant, so no tenant row is visible and new rows take none", async () => {
    const { execute, service } = setUp();
    const ticket = await service.withTenant(jobIn(), async () => new Ticket());
    expect(execute).toHaveBeenCalledWith("select set_config(?, ?, true)", ["app.tenant_id", ""]);
    expect(ticket.tenantId).toBeUndefined();
  });

  it("sets nothing after the work at the top level, where the transaction's end clears the setting", async () => {
    const { execute, flush, service } = setUp();
    await service.withTenant(jobIn(TENANT), async () => null);
    expect(execute).toHaveBeenCalledTimes(1);
    expect(flush).not.toHaveBeenCalled();
  });

  it("puts the enclosing tenant back after the work inside a running transaction, its writes flushed first", async () => {
    const { execute, flush, service } = setUp(true);
    const outer = "scp_01j9z3k4m5n6p7q8r9s0t1v2wb";
    execute.mockResolvedValueOnce([{ tenant: outer }] as never);
    await service.withTenant(jobIn(TENANT), async () => null);
    expect(execute).toHaveBeenCalledTimes(3);
    expect(execute).toHaveBeenNthCalledWith(2, "select set_config(?, ?, true)", [
      "app.tenant_id",
      TENANT,
    ]);
    expect(execute).toHaveBeenNthCalledWith(3, "select set_config(?, ?, true)", [
      "app.tenant_id",
      outer,
    ]);
    // the flush runs between setting the inner tenant and putting the outer one back
    const [, set = 0, restore = 0] = execute.mock.invocationCallOrder;
    expect(flush.mock.invocationCallOrder).toEqual([set + 1]);
    expect(restore).toBe(set + 2);
  });

  it("sets an agent's or a service's own tenant, else its user's, and new rows take it; a platform agent sets ''", async () => {
    const human: Actor = {
      kind: ActorKind.User,
      id: "usr_01j9z3k4m5n6p7q8r9s0t1v2w3",
      realm: Realm.Staff,
    };
    const outer = "scp_01j9z3k4m5n6p7q8r9s0t1v2wb";
    const cases: readonly [Actor, string][] = [
      [
        {
          kind: ActorKind.Agent,
          id: "agt_1",
          scopeId: TENANT,
          onBehalfOf: { ...human, scopeId: TENANT },
        },
        TENANT,
      ],
      // a background agent: no tenant of its own, acting for its owner in the tenant
      [{ kind: ActorKind.Agent, id: "agt_1", onBehalfOf: { ...human, scopeId: TENANT } }, TENANT],
      // a service acting for a user with no tenant of its own takes the user's, as an agent does (ADR 0209, condition 3)
      [{ kind: ActorKind.Service, id: "svc_1", onBehalfOf: { ...human, scopeId: TENANT } }, TENANT],
      // a job acting for a user keeps its own (none)
      [{ kind: ActorKind.Job, id: "job_1", onBehalfOf: { ...human, scopeId: TENANT } }, ""],
      [{ kind: ActorKind.Agent, id: "agt_1", onBehalfOf: human }, ""],
    ];
    for (const [agent, tenant] of cases) {
      const { execute, service } = setUp();
      const ticket = await service.withTenant(agent, async () => new Ticket());
      expect(execute).toHaveBeenCalledWith("select set_config(?, ?, true)", [
        "app.tenant_id",
        tenant,
      ]);
      expect(ticket.tenantId).toBe(tenant === "" ? undefined : tenant);
    }
    // nested, the human's tenant is set, the work flushed, then the enclosing tenant put back, in that order
    const { execute, flush, service } = setUp(true);
    execute.mockResolvedValueOnce([{ tenant: outer }] as never);
    await service.withTenant(cases[1]?.[0] as Actor, async () => null);
    expect(execute).toHaveBeenNthCalledWith(2, "select set_config(?, ?, true)", [
      "app.tenant_id",
      TENANT,
    ]);
    expect(execute).toHaveBeenNthCalledWith(3, "select set_config(?, ?, true)", [
      "app.tenant_id",
      outer,
    ]);
    const [, set = 0, restore = 0] = execute.mock.invocationCallOrder;
    expect(flush.mock.invocationCallOrder).toEqual([set + 1]);
    expect(restore).toBe(set + 2);
  });

  it("passes the work's result and refusal through", async () => {
    const { service } = setUp();
    await expect(service.withTenant(jobIn(TENANT), async () => 42)).resolves.toBe(42);
    const failure = new Error("work failed");
    await expect(
      service.withTenant(jobIn(TENANT), async () => {
        throw failure;
      }),
    ).rejects.toBe(failure);
  });

  it("refuses a tenant id that is not a scope node's id before opening a transaction", () => {
    const { transaction, service } = setUp();
    expect(() =>
      service.withTenant(jobIn("ten_01j9z3k4m5n6p7q8r9s0t1v2wa"), async () => null),
    ).toThrow(TypeError);
    expect(transaction).not.toHaveBeenCalled();
  });
});
