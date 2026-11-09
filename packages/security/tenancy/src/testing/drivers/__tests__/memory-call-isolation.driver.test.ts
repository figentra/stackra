/**
 * Stackra file contract:
 * Purpose: proves `MemoryCallIsolationDriver`, the `memory` `CallIsolation` of the tenancy testing plugin: under
 *          `.useDrivers("memory")` a pipeline action builds a `BelongsToTenant` row carrying the actor's tenant before
 *          any flush; an actor with no tenant stays a platform call; inside `runAsTenant(T)` an actor of another
 *          tenant is refused (`TenantSwitchRefusedError`) and builds no row; an explicit override of `CallIsolation`
 *          wins; a call with a scope runs in its scope session, one without opens none.
 * Boundary: unit tier; the real pipeline through `run`, on a fixture module. Access, approval and the tenancy check
 *           are allowing stand-ins: this file proves the isolation only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269 (decision 3); ADR 0495; ADR 0239.
 */
import { Action, Idempotency, OpenApprovalGateDriver } from "@stackra/actions";
import {
  AccessControl,
  ApprovalGate,
  CallIsolation,
  TenancyCheck,
} from "@stackra/actions/contracts";
import { run } from "@stackra/actions/testing";
import { Driver, Module } from "@stackra/container";
import { createTestingModule, registerWiring } from "@stackra/container/testing";
import { ActorKind, Realm } from "@stackra/contracts";
import type { Actor, ScopeRef } from "@stackra/contracts";
import { Database } from "@stackra/database";
import { HasPublicId, Model } from "@stackra/model";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "@stackra/testing";
import { vi } from "vitest";

import { TenantSwitchRefusedError } from "#core/errors/tenant-switch-refused.error";
import { ACTIVE_TENANT } from "#node/constants/active-tenant.constant";
import { BelongsToTenant } from "#node/traits/belongs-to-tenant.trait";
import "#testing/index";
import { MemoryCallIsolationDriver } from "#testing/drivers/memory-call-isolation.driver";
import { fakeTenantId } from "#testing/functions/fake-tenant-id.function";
import { runAsTenant } from "#testing/functions/run-as-tenant.function";
import { tenantActor } from "#testing/functions/tenant-actor.function";

/** A tenant-owned model. */
class Member extends Model.with(HasPublicId("mbr"), BelongsToTenant) {}

/** The rows the action built, in order. */
const built: Member[] = [];

/** Builds one member and answers its tenant and the running call's, read before any flush. */
class AddMemberAction extends Action({
  key: "member.add",
  actors: [ActorKind.User],
  idempotency: Idempotency.Never,
}) {
  async handle(): Promise<{ tenantId: string | undefined; active: string | undefined }> {
    const member = new Member();
    built.push(member);
    return { tenantId: member.tenantId, active: ACTIVE_TENANT.getStore() };
  }
}

class AllowAll extends Driver(AccessControl) {
  async require(): Promise<void> {}

  async authorize(): Promise<void> {}
}

class NoTenancyCheck extends Driver(TenancyCheck) {
  async check(): Promise<void> {}
}

/** A stand-in isolation that only counts its calls. */
class CountingIsolation extends Driver(CallIsolation) {
  calls = 0;

  run<T>(_actor: Actor, _scope: unknown, work: () => Promise<T>): Promise<T> {
    this.calls += 1;
    return work();
  }
}

class FixtureModule extends Module {}

registerWiring({
  member: "fixture",
  root: FixtureModule,
  bindings: [{ module: "fixture", provide: AddMemberAction, deps: [] }],
});

/** A platform user: no tenant. */
const PLATFORM: Actor = { kind: ActorKind.User, id: "usr_1", realm: Realm.Staff };

/** The fixture on the memory drivers, with the allowing stand-ins. */
function memory() {
  return createTestingModule(FixtureModule)
    .useDrivers("memory")
    .override(AccessControl, new AllowAll())
    .override(ApprovalGate, new OpenApprovalGateDriver())
    .override(TenancyCheck, new NoTenancyCheck());
}

// the first call builds the memory database (PGlite, tenancy's migrations): slower than a test's timeout on a busy box
beforeAll(async () => {
  await memory().compile();
  await run(AddMemberAction, {}, { as: PLATFORM });
}, 120_000);

beforeEach(() => {
  built.length = 0;
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe(MemoryCallIsolationDriver, () => {
  it("is the CallIsolation useDrivers(memory) binds", async () => {
    const app = await memory().compile();
    expect(app.get(CallIsolation)).toBeInstanceOf(MemoryCallIsolationDriver);
  });

  it("runs an action as the actor's tenant, so a new row carries it before any flush", async () => {
    await memory().compile();
    const tenant = fakeTenantId();

    const result = await run(AddMemberAction, {}, { as: tenantActor(tenant) });

    expect(result.output).toEqual({ tenantId: tenant, active: tenant });
    expect(built.map((member) => member.tenantId)).toEqual([tenant]);
  });

  it("keeps an actor with no tenant a platform call", async () => {
    await memory().compile();

    const result = await run(AddMemberAction, {}, { as: PLATFORM });

    expect(result.output).toEqual({ tenantId: undefined, active: undefined });
  });

  it("refuses an actor of another tenant inside runAsTenant, and builds no row", async () => {
    await memory().compile();
    const [held, other] = [fakeTenantId(), fakeTenantId()];

    const result = await runAsTenant(held, () =>
      run(AddMemberAction, {}, { as: tenantActor(other) }),
    );

    expect(result.ok).toBe(false);
    expect(result.error).toBeInstanceOf(TenantSwitchRefusedError);
    expect(built).toEqual([]);
    // the same tenant passes
    const same = await runAsTenant(held, () => run(AddMemberAction, {}, { as: tenantActor(held) }));
    expect(same.output).toEqual({ tenantId: held, active: held });
  });

  it("gives way to an explicit override", async () => {
    const explicit = new CountingIsolation();
    const app = await memory().override(CallIsolation, explicit).compile();
    const tenant = fakeTenantId();

    const result = await run(AddMemberAction, {}, { as: tenantActor(tenant) });

    expect(app.get(CallIsolation)).toBe(explicit);
    expect(explicit.calls).toBe(1);
    expect(result.output).toEqual({ tenantId: undefined, active: undefined });
  });

  it("hands work the actor unchanged", async () => {
    const actor = tenantActor();
    const seen = await new MemoryCallIsolationDriver().run(
      actor,
      undefined,
      async (runAs) => runAs,
    );
    expect(seen).toBe(actor);
  });

  it("runs a call with a scope in its scope session as the tenant, and one without in none", async () => {
    const tenant = fakeTenantId();
    const scope: ScopeRef = { id: tenant, path: "acme" };
    const withScope = vi.fn(async (_scopes: unknown, work: () => Promise<unknown>) => work());
    vi.spyOn(Database, "current").mockReturnValue({ withScope } as unknown as Database);
    const driver = new MemoryCallIsolationDriver();

    const inScope = await driver.run(tenantActor(tenant), scope, async () =>
      ACTIVE_TENANT.getStore(),
    );
    expect(inScope).toBe(tenant);
    expect(withScope).toHaveBeenCalledWith([scope], expect.any(Function));

    withScope.mockClear();
    await driver.run(tenantActor(tenant), undefined, async () => undefined);
    expect(withScope).not.toHaveBeenCalled();
  });
});
