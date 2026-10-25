/**
 * Stackra file contract:
 * Purpose: unit tests of `TenantIsolationService`: `withTenant` runs the work in a transaction after one parameterised
 *          `set_config('app.tenant_id', …, true)` with the actor's tenant, or `''` for an actor with none; new
 *          `BelongsToTenant` rows inside take that tenant; the work's result and refusal pass through; a tenant id that
 *          is not a scope node's id is refused before any transaction opens.
 * Boundary: test only; a fake `Database` records the transaction and the statement, so no database runs.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0239; ADR 0210 (decision 3); ADR 0160.
 */
import { Service } from "@stackra/container";
import { ActorKind } from "@stackra/contracts";
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
const jobIn = (tenantId?: Actor["tenantId"]): Actor => ({
  kind: ActorKind.Job,
  id: "job_01j9z3k4m5n6p7q8r9s0t1v2w3",
  ...(tenantId === undefined ? {} : { tenantId }),
});

/** A recording database whose transaction runs the work. */
function setUp() {
  const execute = vi.fn(async () => []);
  const transaction = vi.fn(async (work: () => Promise<unknown>) => work());
  const database = { em: () => ({ execute }), transaction } as unknown as Database;
  return { execute, transaction, service: new TenantIsolationService(database) };
}

describe(TenantIsolationService, () => {
  it("is a service", () => {
    expect(setUp().service).toBeInstanceOf(Service);
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
