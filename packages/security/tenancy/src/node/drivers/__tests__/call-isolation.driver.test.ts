/**
 * Stackra file contract:
 * Purpose: unit tests of `CallIsolationDriver`: it is a `CallIsolation` driver; it runs the work inside
 *          `Database.withScope` with the call's scope (none: an empty list) and `withTenant` with the actor, in that
 *          order; a read-only unit opens one read-only transaction around both, unless a transaction is already
 *          running; the work's result and refusal pass through.
 * Boundary: test only; a fake `Database` and a fake `TenantIsolationService` record the calls, so no database runs.
 *           The real settings are proven on Postgres in `call-isolation.driver.int.test.ts`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0495.
 */
import { CallIsolation } from "@stackra/actions/contracts";
import { ActorKind } from "@stackra/contracts";
import type { Actor, ScopeRef } from "@stackra/contracts";
import type { Database } from "@stackra/database";
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { CallIsolationDriver } from "#node/drivers/call-isolation.driver";
import type { TenantIsolationService } from "#node/services/tenant-isolation.service";

const actor: Actor = {
  kind: ActorKind.Job,
  id: "job_01j9z3k4m5n6p7q8r9s0t1v2w3",
  scopeId: "scp_01j9z3k4m5n6p7q8r9s0t1v2wa",
};
const scope: ScopeRef = { id: "scp_01j9z3k4m5n6p7q8r9s0t1v2wa", path: "platform.acme" };

/** A recording database and tenant service; `running` says whether a transaction is already open. */
function setUp(running = false) {
  const steps: string[] = [];
  const withScope = vi.fn(async (scopes: unknown, work: () => Promise<unknown>) => {
    steps.push("scope");
    return work();
  });
  const transaction = vi.fn(async (work: () => Promise<unknown>, options?: unknown) => {
    steps.push(`transaction:${JSON.stringify(options)}`);
    return work();
  });
  const withTenant = vi.fn(async (_actor: Actor, work: () => Promise<unknown>) => {
    steps.push("tenant");
    return work();
  });
  const database = {
    em: () => ({ isInTransaction: () => running }),
    withScope,
    transaction,
  } as unknown as Database;
  const isolation = { withTenant } as unknown as TenantIsolationService;
  return {
    steps,
    withScope,
    transaction,
    withTenant,
    driver: new CallIsolationDriver(database, isolation),
  };
}

describe(CallIsolationDriver, () => {
  it("is a CallIsolation driver", () => {
    expect(setUp().driver).toBeInstanceOf(CallIsolation);
  });

  it("runs the work inside the scope and then the tenant, with no transaction of its own", async () => {
    const { steps, withScope, withTenant, transaction, driver } = setUp();
    await expect(driver.run(actor, scope, async () => 42, { readOnly: false })).resolves.toBe(42);
    expect(steps).toEqual(["scope", "tenant"]);
    expect(withScope.mock.calls[0]?.[0]).toBe(scope);
    expect(withTenant.mock.calls[0]?.[0]).toBe(actor);
    expect(transaction).not.toHaveBeenCalled();
  });

  it("scopes a call with no scope to an empty list, which grants no path", async () => {
    const { withScope, driver } = setUp();
    await driver.run(actor, undefined, async () => 1, { readOnly: false });
    expect(withScope.mock.calls[0]?.[0]).toEqual([]);
  });

  it("opens one read-only transaction around both settings for a read-only unit", async () => {
    const { steps, driver } = setUp();
    await driver.run(actor, scope, async () => 1, { readOnly: true });
    expect(steps).toEqual(['transaction:{"readOnly":true}', "scope", "tenant"]);
  });

  it("joins a running transaction instead of starting a read-only one", async () => {
    const { steps, driver } = setUp(true);
    await driver.run(actor, scope, async () => 1, { readOnly: true });
    expect(steps).toEqual(["scope", "tenant"]);
  });

  it("passes the work's refusal through", async () => {
    const { driver } = setUp();
    const failure = new Error("work failed");
    await expect(
      driver.run(
        actor,
        scope,
        async () => {
          throw failure;
        },
        { readOnly: false },
      ),
    ).rejects.toBe(failure);
  });
});
