/**
 * Stackra file contract:
 * Purpose: the isolation test of workflow steps under the real `CallIsolationDriver` of @stackra/tenancy on real
 *          Postgres row security (STA-1717, ADR 0495 decision 2): the native engine on a NOBYPASSRLS service role's
 *          connection runs runs of tenants A and B whose steps read a tenant-owned ticket table. A run started in a
 *          user's call in a branch of A runs its first step in A, and the tick (outside any transaction, as the worker
 *          runs it) resumes it on its signal in A: both steps see only A's tickets and every journal row is A's; B's
 *          run sees only B's. A run whose stored origin names a user of B in A's scope is refused at its step, which
 *          never runs. After the start and after the tick, each connection the steps used carries no `app.*` setting.
 * Boundary: integration tier (`.int`): runs only where `TESTBED_POSTGRES_HOST` names a Postgres and is skipped elsewhere.
 *           One fresh database for the file (`ownerPostgres`, the service role's pool capped at two); the superuser
 *           applies the ticket table, seeds and checks; everything under test runs on the service role's connection.
 *           The scope tree is the in-memory one (the tree's own row security is proven in @stackra/tenancy's
 *           `background-isolation.int.test.ts`); locks are in memory and the clock is the system's.
 * Runtime: node (vitest)
 * Governing contract: ADR 0495 (decisions 1 to 3); ADR 0239 (2026-11-07 amendment, gaps A and C); ADR 0102
 *                     (decision 1); ADR 0182 (integration tier); `.agents/rules/tenancy.md` (points 6 to 8).
 */
import type { Resolver } from "@stackra/actions";
import { CallIsolation } from "@stackra/actions/contracts";
import type { AnyClass } from "@stackra/container";
import {
  type Actor,
  ActorKind,
  Clock,
  type PublicId,
  Realm,
  type ScopeRef,
} from "@stackra/contracts";
import { compileMigration, Migration } from "@stackra/database";
import type { Blueprint, SchemaBuilder } from "@stackra/database";
import { isRefusal } from "@stackra/errors";
import { Locks, MemoryLockDriver } from "@stackra/locking";
import { MemoryScopeTreeDriver } from "@stackra/scope";
import { TenantScopeMismatchError } from "@stackra/tenancy";
import {
  BelongsToTenantMacro,
  CallIsolationDriver,
  TenantIsolationService,
} from "@stackra/tenancy/node";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "@stackra/testing";

import { Signal } from "#core/bases/signal.base";
import { Workflow } from "#core/bases/workflow.base";
import { Step } from "#core/decorators/step.decorator";
import { NativeWorkflowRunnerDriver } from "#core/drivers/native-workflow-runner.driver";
import type { Run } from "#core/types/run.type";
import type { RunOrigin } from "#core/types/run-origin.type";
import type { StepContext } from "#core/types/step-context.type";
import { HOST, ownerPostgres } from "#node/__tests__/fixtures/owner-postgres.fixture";
import type { OwnerPostgres } from "#node/__tests__/fixtures/owner-postgres.fixture";
import { PostgresWorkflowJournalDriver } from "#node/drivers/postgres-workflow-journal.driver";

/** The tenant-owned table the steps read. */
class CreateTicketsMigration extends Migration {
  up(schema: SchemaBuilder): void {
    schema.create("tickets", (t: Blueprint) => {
      t.hasPublicId("tkt");
      t.belongsToTenant();
      t.string("title", 63).notNull().comment("What the ticket is about.");
    });
  }
}

const ROOT: ScopeRef = { id: "scp_01jab3k4m5n6p7q8r9s0t1v2e0", path: "platform" };
const ACME = "scp_01jab3k4m5n6p7q8r9s0t1v2e1" as PublicId<"scp">;
const GLOBEX = "scp_01jab3k4m5n6p7q8r9s0t1v2f1" as PublicId<"scp">;
const SCOPE_A: ScopeRef = { id: ACME, path: "platform.acme" };
const SCOPE_B: ScopeRef = { id: GLOBEX, path: "platform.globex" };
const BRANCH_A: ScopeRef = { id: "scp_01jab3k4m5n6p7q8r9s0t1v2e2", path: "platform.acme.riyadh" };

const A1 = "tkt_01jab3k4m5n6p7q8r9s0t1v2e1";
const A2 = "tkt_01jab3k4m5n6p7q8r9s0t1v2e2";
const B1 = "tkt_01jab3k4m5n6p7q8r9s0t1v2f1";

/** A staff user of the owner `owner`. */
const userOf = (owner: PublicId<"scp">, id: PublicId<"usr">): Actor =>
  Object.freeze({ kind: ActorKind.User, id, realm: Realm.Staff, scopeId: owner });

const USER_A = userOf(ACME, "usr_01jab3k4m5n6p7q8r9s0t1v2e1");
const USER_B = userOf(GLOBEX, "usr_01jab3k4m5n6p7q8r9s0t1v2f1");

class SystemClock extends Clock {
  now(): Date {
    return new Date();
  }
}

/** The file's database, set up in `beforeAll`. */
const state: { postgres?: OwnerPostgres } = {};

/** The file's database. */
function db(): OwnerPostgres {
  if (state.postgres === undefined) throw new Error("the database is not set up");
  return state.postgres;
}

/** Every backend a step ran on since the last check. */
const used = new Set<number>();

/** How many times a step read the tickets, so a refused step is shown not to have run. */
const looked: { count: number } = { count: 0 };

/** The tickets the running step's isolation shows, recorded with the backend it ran on. */
async function look(): Promise<string[]> {
  looked.count += 1;
  // raw-sql: the probe's own read of the tenant-owned table, under the step's isolation
  const rows = (await db()
    .service()
    .em()
    .execute('select id, pg_backend_pid() as pid from "support"."tickets" order by id')) as {
    id: string;
    pid: number;
  }[];
  // raw-sql: the backend id, which only SQL reads (also when no ticket is shown)
  const [backend] = (await db().service().em().execute("select pg_backend_pid() as pid")) as {
    pid: number;
  }[];
  if (backend !== undefined) used.add(backend.pid);
  return rows.map((row) => row.id);
}

/** How many connections the service role's pool holds. */
const POOL = 2;

/** Reads a connection's backend, role and settings, holding it a moment so the pool hands the others out. */
const PROBE =
  "select pg_backend_pid() as pid, current_user as role, " +
  "coalesce(current_setting('app.tenant_id', true), '') as tenant, " +
  "coalesce(current_setting('app.scope_paths', true), '') as scope_paths, " +
  "coalesce(current_setting('app.scope_id', true), '') as scope_id, pg_sleep(0.05)::text as held";

/** Expects every backend the steps used, read on every connection at once, to carry no `app.*` setting or role. */
const expectCleanBackends = async () => {
  const seen = new Set<number>();
  for (let round = 0; round < 20 && [...used].some((pid) => !seen.has(pid)); round += 1) {
    const rows = await Promise.all(
      Array.from(
        { length: POOL },
        // raw-sql: the settings are connection state, which only SQL reads
        async () => (await db().service().em().execute(PROBE)) as Record<string, unknown>[],
      ),
    );
    for (const [row] of rows) {
      expect(row).toMatchObject({ role: db().role, tenant: "", scope_paths: "", scope_id: "" });
      seen.add(Number(row?.["pid"]));
    }
  }
  expect([...used].filter((pid) => !seen.has(pid))).toEqual([]);
};

class Touched extends Signal {
  by!: string;
}

/** Reads the tickets when it starts, then again once its ticket is touched. */
class SurveyWorkflow extends Workflow<{ readonly ticket: string }>({ timeout: "1h" }) {
  async before(): Promise<string[]> {
    return look();
  }

  @Step<SurveyWorkflow>({
    waitFor: Touched,
    correlate: (run) => ({ ticket: run.input.ticket }),
    timeout: "30m",
  })
  async after(_run: Run<this>, _ctx: StepContext, _touched: Touched): Promise<string[]> {
    return look();
  }
}

/** The origin of a run a user starts in `scope`. */
const originOf = (actor: Actor, scope: ScopeRef): RunOrigin => ({
  callId: `call-${actor.id}`,
  key: "ticket.survey",
  actor,
  scopeId: scope.id,
  scope,
  locale: "en",
  timeZone: "UTC",
  currency: "USD",
  market: "default",
});

/** A resolver binding `bound`. */
const resolverOf = (bound: readonly (readonly [AnyClass, object])[]): Resolver => {
  const map = new Map<AnyClass, object>(bound);
  return {
    has: (type) => map.has(type),
    get: <T extends object>(type: AnyClass<T>) => map.get(type) as T,
  };
};

/** The real isolation on the service role's connection, as a deployment binds it. */
const isolationOf = () => {
  const service = db().service();
  const tree = new MemoryScopeTreeDriver().seed([
    { ...ROOT, level: "platform", name: "Platform" },
    { ...SCOPE_A, level: "tenant", name: "Acme" },
    { ...SCOPE_B, level: "tenant", name: "Globex" },
    { ...BRANCH_A, level: "branch", name: "Riyadh" },
  ]);
  return new CallIsolationDriver(service, new TenantIsolationService(service), tree);
};

/** The engine on the service role's connection, with the real isolation bound. */
const engine = () => {
  const clock = new SystemClock();
  const runner = new NativeWorkflowRunnerDriver(
    new PostgresWorkflowJournalDriver(db().service()),
    new Locks(new MemoryLockDriver(clock), clock),
    clock,
  );
  runner.connect(
    resolverOf([
      [SurveyWorkflow, new SurveyWorkflow()],
      [CallIsolation, isolationOf()],
    ]),
  );
  return runner;
};

/** Runs `work` in `actor`'s call in `scope`, as the action pipeline opens one. */
const inCall = <T>(actor: Actor, scope: ScopeRef, work: () => Promise<T>) =>
  isolationOf().run(actor, scope, work, { readOnly: false });

/** Runs `sql` as the superuser, past row security: a seed or a check. */
const superuser = (sql: string, params: readonly unknown[] = []) =>
  db()
    .database.em()
    .execute(sql, [...params]) as Promise<Record<string, unknown>[]>;

/** Starts a survey of `ticket` in `actor`'s call in `scope`, its stored origin `origin`; the run's id. */
const start = async (
  actor: Actor,
  scope: ScopeRef,
  ticket: string,
  origin = originOf(actor, scope),
) => {
  await inCall(actor, scope, () => engine().start(SurveyWorkflow, { ticket }, origin));
  const [row] = await superuser("select id from workflow.runs where input ->> 'ticket' = ?", [
    ticket,
  ]);
  return String(row?.["id"]);
};

/** The run's status and owner, and each step's name, result and owner, in order. */
const journalOf = async (id: string | undefined) => ({
  run: await superuser("select status, tenant_id from workflow.runs where id = ?", [id]),
  steps: await superuser(
    "select name, result, tenant_id from workflow.steps where run_id = ? order by position",
    [id],
  ),
});

describe.skipIf(HOST === undefined)("workflow steps under the tenancy isolation driver", () => {
  const ran: Partial<Record<"a" | "b" | "forged", string>> = {};

  beforeAll(async () => {
    const postgres = await ownerPostgres(undefined, { pool: POOL });
    state.postgres = postgres;
    await postgres.apply(
      compileMigration(CreateTicketsMigration, {
        schema: "support",
        createsSchema: true,
        macros: [BelongsToTenantMacro],
      }),
    );
    for (const statement of [
      `grant usage on schema support to "${postgres.role}"`,
      `grant select on all tables in schema support to "${postgres.role}"`,
    ])
      // raw-sql: the fixture's grants, as a superuser
      await postgres.database.em().execute(statement);
    for (const [id, owner] of [
      [A1, ACME],
      [A2, ACME],
      [B1, GLOBEX],
    ])
      await postgres.database
        .em()
        .execute("insert into support.tickets (id, tenant_id, title) values (?, ?, 't')", [
          id,
          owner,
        ]);
  }, 120_000);

  afterAll(async () => {
    await state.postgres?.close();
  });

  beforeEach(() => {
    used.clear();
    looked.count = 0;
  });

  it("runs the first step of a run started in a branch of A in A, which sees only A's tickets", async () => {
    ran.a = await start(USER_A, BRANCH_A, "a");
    ran.b = await start(USER_B, SCOPE_B, "b");
    expect(await journalOf(ran.a)).toEqual({
      run: [{ status: "waiting", tenant_id: ACME }],
      steps: [
        { name: "before", result: [A1, A2], tenant_id: ACME },
        { name: "after", result: null, tenant_id: ACME },
      ],
    });
    expect(await journalOf(ran.b)).toEqual({
      run: [{ status: "waiting", tenant_id: GLOBEX }],
      steps: [
        { name: "before", result: [B1], tenant_id: GLOBEX },
        { name: "after", result: null, tenant_id: GLOBEX },
      ],
    });
    await expectCleanBackends();
  });

  it("resumes each run on its tenant's signal from the tick, its step seeing only its tenant's tickets", async () => {
    // a signal is taken by a waiting run of its own scope: A's run was started in the branch
    await inCall(USER_A, BRANCH_A, () =>
      engine().hold(Touched, { by: USER_A.id }, { ticket: "a" }),
    );
    await inCall(USER_B, SCOPE_B, () => engine().hold(Touched, { by: USER_B.id }, { ticket: "b" }));
    used.clear();
    expect(await engine().tick()).toBe(2);
    expect(await journalOf(ran.a)).toEqual({
      run: [{ status: "completed", tenant_id: ACME }],
      steps: [
        { name: "before", result: [A1, A2], tenant_id: ACME },
        { name: "after", result: [A1, A2], tenant_id: ACME },
      ],
    });
    expect(await journalOf(ran.b)).toEqual({
      run: [{ status: "completed", tenant_id: GLOBEX }],
      steps: [
        { name: "before", result: [B1], tenant_id: GLOBEX },
        { name: "after", result: [B1], tenant_id: GLOBEX },
      ],
    });
    expect(used.size).toBeGreaterThan(0);
    await expectCleanBackends();
  });

  it("refuses a run whose stored origin is a user of B in A's scope: its step never runs and reads nothing", async () => {
    await expect(start(USER_A, SCOPE_A, "forged", originOf(USER_B, SCOPE_A))).rejects.toSatisfy(
      (error: unknown) => isRefusal(error, TenantScopeMismatchError),
    );
    expect(looked.count).toBe(0);
    const [row] = await superuser(
      "select id, status, tenant_id from workflow.runs where input ->> 'ticket' = 'forged'",
    );
    expect(row).toMatchObject({ tenant_id: ACME });
    expect(row?.["status"]).not.toBe("completed");
    // the refused step is journalled with no result in the run's owner, and the run stops before the next one
    expect((await journalOf(String(row?.["id"]))).steps).toEqual([
      { name: "before", result: null, tenant_id: ACME },
    ]);
  });
});
