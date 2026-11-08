/**
 * Stackra file contract:
 * Purpose: unit tests of `CallIsolationDriver`: it is a `CallIsolation` driver; it runs the work inside
 *          `Database.withScope` with the call's scope (none: an empty list) and `withTenant` with the actor, in that
 *          order; a read-only unit opens one read-only transaction around both, unless a transaction is already
 *          running; the work's result and refusal pass through; and the tenant resolution rules (ADR 0495, note of
 *          2026-11-01): a job or system actor takes the tenant of its platform-written scope (a branch resolves to its
 *          parent tenant, a scheduler actor named by the branch included), a scope the tree does not show or shows at
 *          another path is refused and never run with an empty tenant, a scope above every tenant keeps the actor's own
 *          id, any other actor keeps its own tenant and is refused (`TenantScopeMismatchError`) when the scope's
 *          tenant differs or a user's, agent's or service's scope sits above every tenant or is unknown to the tree (a
 *          platform user, agent or service stays a platform call there), a service whose own tenant differs from its
 *          user's is refused and one with none runs in its user's, a claimed scope is read through the tree (a branch
 *          user of A runs in A, and the work receives the actor with A as its tenant, also through a service or agent of A; one of B's branch is refused; a claimed scope the
 *          tree does not show or above every tenant is refused), a failing tree read fails the call before it runs, several granted scopes that span tenants are
 *          refused while several within one tenant run in it, and the tree is read in a session over the path's root
 *          label.
 * Boundary: test only; a fake `Database` and a fake `TenantIsolationService` record the calls, so no database runs,
 *           and a `MemoryScopeTreeDriver` holds the tree. The real settings are proven on Postgres in
 *           `call-isolation.driver.int.test.ts`.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0495.
 */
import { CallIsolation } from "@stackra/actions/contracts";
import { ActorKind, Realm } from "@stackra/contracts";
import type { Actor, ScopeRef } from "@stackra/contracts";
import type { Database } from "@stackra/database";
import { MemoryScopeTreeDriver } from "@stackra/scope";
import { describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { TenantScopeMismatchError } from "#core/errors/tenant-scope-mismatch.error";
import { TenantScopeUnresolvedError } from "#core/errors/tenant-scope-unresolved.error";
import { TenantSwitchRefusedError } from "#core/errors/tenant-switch-refused.error";
import { CallIsolationDriver } from "#node/drivers/call-isolation.driver";
import type { TenantIsolationService } from "#node/services/tenant-isolation.service";

const ID_A = "scp_01j9z3k4m5n6p7q8r9s0t1v2wa";
const ID_B = "scp_01j9z3k4m5n6p7q8r9s0t1v2wb";
const ID_BRANCH = "scp_01j9z3k4m5n6p7q8r9s0t1v2wc";
const ID_PLATFORM = "scp_01j9z3k4m5n6p7q8r9s0t1v2wd";
const ID_UNKNOWN = "scp_01j9z3k4m5n6p7q8r9s0t1v2we";
const ID_BRANCH_B = "scp_01j9z3k4m5n6p7q8r9s0t1v2wf";

const scope: ScopeRef = { id: ID_A, path: "platform.acme" };
const branch: ScopeRef = { id: ID_BRANCH, path: "platform.acme.riyadh" };
const tenantB: ScopeRef = { id: ID_B, path: "platform.globex" };
const platformScope: ScopeRef = { id: ID_PLATFORM, path: "platform" };
const unknown: ScopeRef = { id: ID_UNKNOWN, path: "platform.nowhere" };
const branchOfB: ScopeRef = { id: ID_BRANCH_B, path: "platform.globex.jeddah" };

/** The tree: the platform, tenants A and B under it, and a branch under each. */
const tree = () =>
  new MemoryScopeTreeDriver().seed([
    { ...platformScope, level: "platform", name: "Platform" },
    { ...scope, level: "tenant", name: "Acme" },
    { ...tenantB, level: "tenant", name: "Globex" },
    { ...branch, level: "branch", name: "Riyadh" },
    { ...branchOfB, level: "branch", name: "Jeddah" },
  ]);

const actor: Actor = { kind: ActorKind.Job, id: "job_01j9z3k4m5n6p7q8r9s0t1v2w3", scopeId: ID_A };

/** A user of tenant A, and a staff user acting in no tenant. */
const userOfA: Actor = {
  kind: ActorKind.User,
  id: "usr_01j9z3k4m5n6p7q8r9s0t1v2w3",
  realm: Realm.Staff,
  scopeId: ID_A,
};
const staff: Actor = { kind: ActorKind.User, id: userOfA.id, realm: Realm.Staff };

/** An agent of tenant A acting for its user, and one that carries only that user's tenant. */
const agentOfA: Actor = { kind: ActorKind.Agent, id: "agt_1", scopeId: ID_A, onBehalfOf: userOfA };
const agentForA: Actor = { kind: ActorKind.Agent, id: "agt_1", onBehalfOf: userOfA };

/** A service principal of tenant A calling for its user, one with no tenant calling for that user, and one alone. */
const serviceOfA: Actor = {
  kind: ActorKind.Service,
  id: "svc_01j9z3k4m5n6p7q8r9s0t1v2w5",
  scopeId: ID_A,
  onBehalfOf: userOfA,
};
const serviceForA: Actor = {
  kind: ActorKind.Service,
  id: "svc_01j9z3k4m5n6p7q8r9s0t1v2w5",
  onBehalfOf: userOfA,
};
const platformService: Actor = { kind: ActorKind.Service, id: "svc_01j9z3k4m5n6p7q8r9s0t1v2w5" };

/** A service and an agent of tenant A, each calling for `user`. */
const delegates = (user: Actor): readonly Actor[] => [
  { ...serviceOfA, onBehalfOf: user },
  { ...agentOfA, onBehalfOf: user },
];

/** A recording database and tenant service; `running` says whether a transaction is already open. */
function setUp(running = false, held = "", scopeTree: MemoryScopeTreeDriver = tree()) {
  const steps: string[] = [];
  const withScope = vi.fn(async (_scopes: unknown, work: () => Promise<unknown>) => {
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
  const isolation = {
    withTenant,
    currentTenant: async () => held,
  } as unknown as TenantIsolationService;
  return {
    steps,
    withScope,
    transaction,
    withTenant,
    driver: new CallIsolationDriver(database, isolation, scopeTree),
  };
}

/** The tenant (`scopeId`) the isolation was asked to run as. */
const tenantOfRun = (withTenant: { mock: { calls: unknown[][] } }) => {
  const [first] = withTenant.mock.calls;
  return (first?.[0] as Actor | undefined)?.scopeId;
};

/** Runs `who` in `at` through `driver`, writable, and answers `"ran"`. */
const run = (
  driver: CallIsolationDriver,
  who: Actor,
  at: ScopeRef | readonly ScopeRef[] | undefined,
) => driver.run(who, at, async () => "ran", { readOnly: false });

describe(CallIsolationDriver, () => {
  it("is a CallIsolation driver", () => {
    expect(setUp().driver).toBeInstanceOf(CallIsolation);
  });

  it("runs the work inside the scope and then the tenant, with no transaction of its own", async () => {
    const { steps, withScope, withTenant, transaction, driver } = setUp();
    await expect(driver.run(actor, scope, async () => 42, { readOnly: false })).resolves.toBe(42);
    // the first scope session reads the tree, the second is the call's own
    expect(steps).toEqual(["scope", "scope", "tenant"]);
    expect(withScope.mock.calls[1]?.[0]).toBe(scope);
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
    expect(steps).toEqual(['transaction:{"readOnly":true}', "scope", "scope", "tenant"]);
  });

  it("joins a running transaction instead of starting a read-only one", async () => {
    const { steps, driver } = setUp(true);
    await driver.run(actor, scope, async () => 1, { readOnly: true });
    expect(steps).toEqual(["scope", "scope", "tenant"]);
  });

  it("refuses a running transaction that is set to another tenant, and runs one set to the same or to none", async () => {
    await expect(
      setUp(true, ID_B).driver.run(actor, scope, async () => 1, {
        readOnly: false,
      }),
    ).rejects.toBeInstanceOf(TenantSwitchRefusedError);
    await expect(
      setUp(true, ID_B).driver.run({ kind: ActorKind.Job, id: actor.id }, scope, async () => 1, {
        readOnly: false,
      }),
    ).rejects.toBeInstanceOf(TenantSwitchRefusedError);
    await expect(
      setUp(true, ID_A).driver.run(actor, scope, async () => 1, { readOnly: false }),
    ).resolves.toBe(1);
    await expect(
      setUp(true, "").driver.run(actor, scope, async () => 1, { readOnly: false }),
    ).resolves.toBe(1);
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

describe("the tenant of a call", () => {
  it("takes a job's tenant from its platform-written scope when the job has no origin", async () => {
    const { driver, withTenant } = setUp();
    await run(driver, { kind: ActorKind.Job, id: actor.id }, scope);
    expect(tenantOfRun(withTenant)).toBe(ID_A);
  });

  it("resolves a branch scope to its parent tenant, for a job and for the scheduler's system actor named by the branch", async () => {
    const job = setUp();
    await run(job.driver, { kind: ActorKind.Job, id: actor.id }, branch);
    expect(tenantOfRun(job.withTenant)).toBe(ID_A);
    const scheduled = setUp();
    await run(
      scheduled.driver,
      { kind: ActorKind.System, id: "sys_scheduler", scopeId: ID_BRANCH },
      branch,
    );
    expect(tenantOfRun(scheduled.withTenant)).toBe(ID_A);
  });

  it("refuses a job that claims another tenant than its scope's, instead of taking the scope's", async () => {
    const claims: readonly Actor[] = [
      { ...actor, scopeId: ID_B },
      { kind: ActorKind.Job, id: actor.id, onBehalfOf: { ...userOfA, scopeId: ID_B } },
      { ...actor, scopeId: ID_B, onBehalfOf: { ...userOfA, scopeId: ID_B } },
    ];
    for (const who of claims) {
      const { driver, withTenant } = setUp();
      await expect(run(driver, who, scope)).rejects.toBeInstanceOf(TenantScopeMismatchError);
      expect(withTenant).not.toHaveBeenCalled();
    }
  });

  it("lets a job act for a user of the scope's own tenant, also in a branch, and runs it in that tenant", async () => {
    const forUser: Actor = { ...actor, onBehalfOf: userOfA };
    for (const at of [scope, branch]) {
      const { driver, withTenant } = setUp();
      await run(driver, forUser, at);
      expect(tenantOfRun(withTenant)).toBe(ID_A);
    }
  });

  it("refuses a job that claims a tenant when its scope is above every tenant, and runs one that claims none or only the scope's own id", async () => {
    const claiming = setUp();
    await expect(run(claiming.driver, actor, platformScope)).rejects.toBeInstanceOf(
      TenantScopeMismatchError,
    );
    expect(claiming.withTenant).not.toHaveBeenCalled();
    const platformJob: Actor = { kind: ActorKind.System, id: "sys_maintenance" };
    const none = setUp();
    await run(none.driver, platformJob, platformScope);
    expect(none.withTenant.mock.calls[0]?.[0]).toBe(platformJob);
    const stamped: Actor = { kind: ActorKind.System, id: "sys_scheduler", scopeId: ID_PLATFORM };
    const stamp = setUp();
    await run(stamp.driver, stamped, platformScope);
    expect(stamp.withTenant.mock.calls[0]?.[0]).toBe(stamped);
  });

  it("refuses an agent whose tenant differs from the human's it acts for, and runs one in the same tenant", async () => {
    const agent: Actor = { kind: ActorKind.Agent, id: "agt_1", scopeId: ID_A, onBehalfOf: userOfA };
    const refused = setUp();
    await expect(
      run(refused.driver, { ...agent, onBehalfOf: { ...userOfA, scopeId: ID_B } }, undefined),
    ).rejects.toBeInstanceOf(TenantScopeMismatchError);
    expect(refused.withTenant).not.toHaveBeenCalled();
    const same = setUp();
    await run(same.driver, agent, scope);
    expect(same.withTenant.mock.calls[0]?.[0]).toBe(agent);
  });

  it("refuses a job or system call whose scope the tree does not show, and never runs it with an empty tenant", async () => {
    for (const who of [actor, { kind: ActorKind.System, id: "sys_scheduler" } as Actor]) {
      const { driver, withTenant } = setUp();
      await expect(run(driver, who, unknown)).rejects.toBeInstanceOf(TenantScopeUnresolvedError);
      expect(withTenant).not.toHaveBeenCalled();
    }
  });

  it("refuses a scope whose id belongs to one tenant and whose path names another, so a forged reference crosses nothing", async () => {
    const { driver, withTenant } = setUp();
    await expect(
      run(driver, { kind: ActorKind.Job, id: actor.id }, { id: ID_A, path: tenantB.path }),
    ).rejects.toBeInstanceOf(TenantScopeUnresolvedError);
    expect(withTenant).not.toHaveBeenCalled();
  });

  it("refuses several granted scopes that span tenants, or a tenant and above every tenant, for any actor", async () => {
    const spans: readonly (readonly ScopeRef[])[] = [
      [scope, tenantB],
      [branch, tenantB],
      [scope, platformScope],
      [scope, unknown],
    ];
    for (const at of spans)
      for (const who of [actor, userOfA, staff]) {
        const { driver, withTenant, transaction } = setUp();
        await expect(run(driver, who, at)).rejects.toBeInstanceOf(TenantScopeMismatchError);
        expect(withTenant).not.toHaveBeenCalled();
        expect(transaction).not.toHaveBeenCalled();
      }
  });

  it("runs several granted scopes within one tenant in that tenant, and derives none from no scope", async () => {
    const user = setUp();
    await expect(run(user.driver, userOfA, [scope, branch])).resolves.toBe("ran");
    expect(user.withTenant.mock.calls[0]?.[0]).toBe(userOfA);
    expect(user.withScope.mock.calls.at(-1)?.[0]).toEqual([scope, branch]);
    const job = setUp();
    await run(job.driver, { kind: ActorKind.Job, id: actor.id }, [branch, scope]);
    expect(tenantOfRun(job.withTenant)).toBe(ID_A);
    const other = setUp();
    await expect(run(other.driver, userOfA, [tenantB])).rejects.toBeInstanceOf(
      TenantScopeMismatchError,
    );
    const none = setUp();
    await run(none.driver, actor, undefined);
    expect(none.withTenant.mock.calls[0]?.[0]).toBe(actor);
  });

  it("reads the tree in a session over the root label of the scope's path, then sets the call's own scope", async () => {
    const { driver, withScope } = setUp();
    await run(driver, { kind: ActorKind.Job, id: actor.id }, branch);
    expect(withScope.mock.calls[0]?.[0]).toEqual({ id: ID_BRANCH, path: "platform" });
    expect(withScope.mock.calls[1]?.[0]).toBe(branch);
  });

  it("keeps a user in its own tenant, also in a branch of it", async () => {
    const same = setUp();
    await run(same.driver, userOfA, scope);
    expect(same.withTenant.mock.calls[0]?.[0]).toBe(userOfA);
    const inBranch = setUp();
    await run(inBranch.driver, userOfA, branch);
    expect(inBranch.withTenant.mock.calls[0]?.[0]).toBe(userOfA);
  });

  it("refuses a user whose tenant and whose scope's tenant differ, instead of picking one", async () => {
    const cases: readonly (readonly [Actor, ScopeRef])[] = [
      [userOfA, tenantB],
      [{ ...userOfA, scopeId: ID_B }, branch],
    ];
    for (const [who, at] of cases) {
      const { driver, withTenant, transaction } = setUp();
      await expect(run(driver, who, at)).rejects.toBeInstanceOf(TenantScopeMismatchError);
      expect(withTenant).not.toHaveBeenCalled();
      expect(transaction).not.toHaveBeenCalled();
    }
  });

  it("refuses the same disagreement for a service actor, which keeps its own tenant like a user", async () => {
    const { driver, withTenant } = setUp();
    const service: Actor = { kind: ActorKind.Service, id: "svc_commerce", scopeId: ID_A };
    await expect(run(driver, service, tenantB)).rejects.toBeInstanceOf(TenantScopeMismatchError);
    expect(withTenant).not.toHaveBeenCalled();
  });

  it("refuses a user of a tenant in a scope above every tenant, and runs a platform user there", async () => {
    const refused = setUp();
    const work = vi.fn(async () => "ran");
    await expect(
      refused.driver.run(userOfA, platformScope, work, { readOnly: false }),
    ).rejects.toBeInstanceOf(TenantScopeMismatchError);
    expect(work).not.toHaveBeenCalled();
    expect(refused.withTenant).not.toHaveBeenCalled();
    expect(refused.transaction).not.toHaveBeenCalled();
    const platform = setUp();
    await expect(run(platform.driver, staff, platformScope)).resolves.toBe("ran");
    expect(platform.withTenant.mock.calls[0]?.[0]).toBe(staff);
  });

  it("never derives a tenant for a user with none, so a staff user stays a platform call", async () => {
    const { driver, withTenant } = setUp();
    await run(driver, staff, scope);
    expect(withTenant.mock.calls[0]?.[0]).toBe(staff);
  });

  it("refuses a user of a tenant whose scope the tree does not show, so a forged path above its tenant crosses nothing", async () => {
    const cases: readonly (ScopeRef | readonly ScopeRef[])[] = [
      unknown,
      // tenant A's own id with the path of the platform root: the tree shows A elsewhere
      { id: ID_A, path: platformScope.path },
      // a path inside nothing the tree holds
      { id: ID_UNKNOWN, path: "nowhere" },
      // several scopes, all unknown to the tree
      [unknown, { id: ID_A, path: platformScope.path }],
    ];
    for (const at of cases) {
      const { driver, withTenant, transaction } = setUp();
      const work = vi.fn(async () => "ran");
      await expect(driver.run(userOfA, at, work, { readOnly: false })).rejects.toBeInstanceOf(
        TenantScopeMismatchError,
      );
      expect(work).not.toHaveBeenCalled();
      expect(withTenant).not.toHaveBeenCalled();
      expect(transaction).not.toHaveBeenCalled();
    }
    const known = setUp();
    await expect(run(known.driver, userOfA, scope)).resolves.toBe("ran");
    expect(known.withTenant.mock.calls[0]?.[0]).toBe(userOfA);
  });

  it("keeps a platform user a platform call in a scope the tree does not show", async () => {
    const { driver, withTenant } = setUp();
    await expect(run(driver, staff, unknown)).resolves.toBe("ran");
    expect(withTenant.mock.calls[0]?.[0]).toBe(staff);
  });

  it("refuses an agent of a tenant whose scope the tree does not show or sits above every tenant, before any setting", async () => {
    const cases: readonly (ScopeRef | readonly ScopeRef[])[] = [
      unknown,
      { id: ID_A, path: platformScope.path },
      { id: ID_UNKNOWN, path: "nowhere" },
      [unknown, { id: ID_A, path: platformScope.path }],
      platformScope,
    ];
    // an agent with a tenant of its own, and one that carries only its human's (Tamo's background agent)
    for (const agent of [agentOfA, agentForA])
      for (const at of cases) {
        const { driver, withTenant, withScope, transaction } = setUp();
        const work = vi.fn(async () => "ran");
        await expect(driver.run(agent, at, work, { readOnly: false })).rejects.toBeInstanceOf(
          TenantScopeMismatchError,
        );
        expect(work).not.toHaveBeenCalled();
        expect(withTenant).not.toHaveBeenCalled();
        expect(transaction).not.toHaveBeenCalled();
        // the only scope sessions are the tree reads over the root label, never the call's own
        expect(withScope.mock.calls.map(([granted]) => granted)).not.toContain(at);
      }
    for (const agent of [agentOfA, agentForA]) {
      const known = setUp();
      await expect(run(known.driver, agent, branch)).resolves.toBe("ran");
      expect(known.withTenant.mock.calls[0]?.[0]).toBe(agent);
    }
  });

  it("refuses an agent that carries only its human's tenant in another tenant's scope", async () => {
    const { driver, withTenant } = setUp();
    await expect(run(driver, agentForA, tenantB)).rejects.toBeInstanceOf(TenantScopeMismatchError);
    expect(withTenant).not.toHaveBeenCalled();
  });

  it("keeps an agent with no tenant, acting for a platform user, a platform call", async () => {
    const platformAgent: Actor = { kind: ActorKind.Agent, id: "agt_1", onBehalfOf: staff };
    for (const at of [unknown, platformScope]) {
      const { driver, withTenant } = setUp();
      await expect(run(driver, platformAgent, at)).resolves.toBe("ran");
      expect(withTenant.mock.calls[0]?.[0]).toBe(platformAgent);
    }
  });

  it("refuses a service whose own tenant differs from the user's it calls for, and runs one in the same tenant", async () => {
    const refused = setUp();
    await expect(
      run(refused.driver, { ...serviceOfA, onBehalfOf: { ...userOfA, scopeId: ID_B } }, undefined),
    ).rejects.toBeInstanceOf(TenantScopeMismatchError);
    expect(refused.withTenant).not.toHaveBeenCalled();
    for (const service of [serviceOfA, serviceForA]) {
      const same = setUp();
      await expect(run(same.driver, service, scope)).resolves.toBe("ran");
      expect(same.withTenant.mock.calls[0]?.[0]).toBe(service);
    }
  });

  it("refuses a service of a tenant whose scope the tree does not show or sits above every tenant, before any setting", async () => {
    const cases: readonly (ScopeRef | readonly ScopeRef[])[] = [
      unknown,
      { id: ID_A, path: platformScope.path },
      { id: ID_UNKNOWN, path: "nowhere" },
      [unknown, { id: ID_A, path: platformScope.path }],
      platformScope,
    ];
    // a service with a tenant of its own, one that carries only its user's, and one of A alone
    const services: readonly Actor[] = [
      serviceOfA,
      serviceForA,
      { kind: ActorKind.Service, id: platformService.id, scopeId: ID_A },
    ];
    for (const service of services)
      for (const at of cases) {
        const { driver, withTenant, withScope, transaction } = setUp();
        const work = vi.fn(async () => "ran");
        await expect(driver.run(service, at, work, { readOnly: false })).rejects.toBeInstanceOf(
          TenantScopeMismatchError,
        );
        expect(work).not.toHaveBeenCalled();
        expect(withTenant).not.toHaveBeenCalled();
        expect(transaction).not.toHaveBeenCalled();
        expect(withScope.mock.calls.map(([granted]) => granted)).not.toContain(at);
      }
  });

  it("refuses a service that carries only its user's tenant in another tenant's scope", async () => {
    const { driver, withTenant } = setUp();
    await expect(run(driver, serviceForA, tenantB)).rejects.toBeInstanceOf(
      TenantScopeMismatchError,
    );
    expect(withTenant).not.toHaveBeenCalled();
  });

  it("keeps a service with no tenant and no user, or calling for a platform user, a platform call", async () => {
    for (const service of [platformService, { ...platformService, onBehalfOf: staff }])
      for (const at of [undefined, unknown, platformScope]) {
        const { driver, withTenant } = setUp();
        await expect(run(driver, service, at)).resolves.toBe("ran");
        expect(withTenant.mock.calls[0]?.[0]).toBe(service);
      }
  });

  it("reads a claimed branch as its tenant: a branch user of A runs in A, in A's scope or its branch", async () => {
    const branchUser: Actor = { ...userOfA, scopeId: ID_BRANCH };
    for (const at of [scope, branch]) {
      const { driver, withTenant } = setUp();
      await expect(run(driver, branchUser, at)).resolves.toBe("ran");
      // the isolation runs as the tenant, never the branch id
      expect(tenantOfRun(withTenant)).toBe(ID_A);
    }
    // the work receives that actor, so the pipeline writes the tenant the isolation set
    const handed = await setUp().driver.run(branchUser, branch, async (runAs) => runAs, {
      readOnly: false,
    });
    expect(handed).toEqual({ ...branchUser, scopeId: ID_A });
    const other = setUp();
    await expect(run(other.driver, branchUser, tenantB)).rejects.toBeInstanceOf(
      TenantScopeMismatchError,
    );
  });

  it("runs a tenant-bound service or agent for a branch user of its tenant, and refuses one of another tenant's branch", async () => {
    const userOfBranchA: Actor = { ...userOfA, scopeId: ID_BRANCH };
    const userOfBranchB: Actor = { ...userOfA, scopeId: ID_BRANCH_B };
    for (const delegate of delegates(userOfBranchA))
      for (const at of [scope, branch]) {
        const { driver, withTenant } = setUp();
        await expect(run(driver, delegate, at)).resolves.toBe("ran");
        expect(tenantOfRun(withTenant)).toBe(ID_A);
      }
    for (const delegate of delegates(userOfBranchB))
      for (const at of [scope, branch, branchOfB]) {
        const { driver, withTenant } = setUp();
        await expect(run(driver, delegate, at)).rejects.toBeInstanceOf(TenantScopeMismatchError);
        expect(withTenant).not.toHaveBeenCalled();
      }
    // with no tenant of its own, the service or agent runs in the tenant of its user's branch
    for (const delegate of [
      { ...serviceForA, onBehalfOf: userOfBranchA },
      { ...agentForA, onBehalfOf: userOfBranchA },
    ]) {
      const { driver, withTenant } = setUp();
      await expect(run(driver, delegate, branch)).resolves.toBe("ran");
      expect(tenantOfRun(withTenant)).toBe(ID_A);
    }
  });

  it("refuses a claimed scope the tree does not show, or one above every tenant", async () => {
    const claims: readonly Actor[] = [
      { ...userOfA, scopeId: ID_UNKNOWN },
      { ...userOfA, scopeId: ID_PLATFORM },
      { ...serviceOfA, onBehalfOf: { ...userOfA, scopeId: ID_UNKNOWN } },
      { ...serviceForA, onBehalfOf: { ...userOfA, scopeId: ID_UNKNOWN } },
      { ...agentOfA, scopeId: ID_UNKNOWN },
    ];
    for (const who of claims) {
      const { driver, withTenant, transaction } = setUp();
      await expect(run(driver, who, scope)).rejects.toBeInstanceOf(TenantScopeMismatchError);
      expect(withTenant).not.toHaveBeenCalled();
      expect(transaction).not.toHaveBeenCalled();
    }
  });

  it("fails the call when the tree read fails, never running it", async () => {
    const broken = tree();
    vi.spyOn(broken, "node").mockRejectedValue(new Error("tree unreachable"));
    const { driver, withTenant } = setUp(false, "", broken);
    for (const who of [userOfA, serviceOfA, agentForA]) {
      const work = vi.fn(async () => "ran");
      await expect(driver.run(who, scope, work, { readOnly: false })).rejects.toThrow(
        "tree unreachable",
      );
      expect(work).not.toHaveBeenCalled();
    }
    expect(withTenant).not.toHaveBeenCalled();
  });

  it("compares a running transaction's tenant with the resolved one, not with the actor's own id", async () => {
    const sameTenant = setUp(true, ID_A);
    await expect(
      run(
        sameTenant.driver,
        { kind: ActorKind.System, id: "sys_scheduler", scopeId: ID_BRANCH },
        branch,
      ),
    ).resolves.toBe("ran");
    const other = setUp(true, ID_B);
    await expect(
      run(other.driver, { kind: ActorKind.Job, id: actor.id }, branch),
    ).rejects.toBeInstanceOf(TenantSwitchRefusedError);
  });

  it("compares a running transaction's tenant with the human's for an agent with none of its own", async () => {
    const held = setUp(true, ID_A);
    await expect(run(held.driver, agentForA, scope)).resolves.toBe("ran");
    expect(held.withTenant.mock.calls[0]?.[0]).toBe(agentForA);
    const other = setUp(true, ID_B);
    await expect(run(other.driver, agentForA, undefined)).rejects.toBeInstanceOf(
      TenantSwitchRefusedError,
    );
  });
});
