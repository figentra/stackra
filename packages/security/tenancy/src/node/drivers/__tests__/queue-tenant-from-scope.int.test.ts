/**
 * Stackra file contract:
 * Purpose: integration tests of the tenant a background job runs in, on real Postgres (STA-1823, ADR 0495 note of
 *          2026-11-01): a real `QueueWorkerService` with `CallIsolationDriver` bound runs a declared job action that
 *          lists a `t.belongsToTenant()` table, as a role that is neither the owner nor `BYPASSRLS`, over a real scope
 *          tree (a platform node, tenants A and B, and a branch under A) with the row security `scope.scope_nodes` has.
 *          Pushed with `{ scope: A }` or `{ scope: branch }` and no origin, the job sees only tenant A's rows; a job
 *          stamped as the scheduler's system actor in the branch likewise (the actor names the branch id, which is no
 *          tenant); tenant B's scope sees only B's; the pipeline lists only A's rows for a user of A in scope A; and the
 *          negative cases refuse: a user of A in B's scope or in the root scope above every tenant
 *          (`tenant_scope_mismatch`; a platform user lists there and sees no tenant row), a job whose scope the tree does
 *          not show, and a scope whose id is A's but whose path is B's (`tenant_scope_unresolved`, the handler never
 *          runs), and a pushed scope that is not a `ScopeRef` (`scope_not_platform_written`). A last test states why the
 *          driver reads the tree from the path's root: the branch's own scope session cannot see its tenant.
 * Boundary: integration tier (`.int`): needs Docker for Testcontainers. The container's user is a superuser, which row
 *           security never restricts, so every statement of the work and every read of the tree starts with
 *           `set local role stackra_probe`. The tree table is a fixture that applies the same generated policy as the
 *           scope package's migration (`rowLevelSecurity("scope_path", { match: "ancestor" })`), because that migration
 *           is found by its path and not exported; the fixture tree driver reads it with SQL as the probe role, so the
 *           real visibility rules apply. The scheduler's stamp is written out here (its helper is private): a `system`
 *           actor with `scopeId` the schedule's scope id, as `scheduler.service.ts` builds it.
 * Runtime: node (vitest)
 * Governing contract: ADR 0495 (decisions 1 and 2 and the note of 2026-11-01); ADR 0098; ADR 0327 (decision 9); ADR 0182
 *                     (integration tier); ADR 0022; ADR 0269.
 */
import { Action, ActionPipeline, Query } from "@stackra/actions";
import type { Resolver } from "@stackra/actions";
import { AccessControl, CallIsolation, UnitOfWork } from "@stackra/actions/contracts";
import { type AnyClass, Driver } from "@stackra/container";
import { ActorKind, Clock, Realm } from "@stackra/contracts";
import type { Actor, PublicId, ScopeRef } from "@stackra/contracts";
import { compileMigration, Extension, Migration } from "@stackra/database";
import type { Blueprint, SchemaBuilder } from "@stackra/database";
import { DatabaseUnitOfWorkDriver } from "@stackra/database/node";
import { usePostgres } from "@stackra/database/testing";
import { isRefusal } from "@stackra/errors";
import {
  JobOutcome,
  MemoryQueueDriver,
  QueueService,
  ScopeNotPlatformWrittenError,
} from "@stackra/queue";
import { QueueWorkerService } from "@stackra/queue/node";
import { ScopeTree } from "@stackra/scope/contracts";
import type { ScopeEntry } from "@stackra/scope/contracts";
import { beforeAll, describe, expect, it } from "@stackra/testing";

import { TenantScopeMismatchError } from "#core/errors/tenant-scope-mismatch.error";
import { TenantScopeUnresolvedError } from "#core/errors/tenant-scope-unresolved.error";
import { BelongsToTenantMacro } from "#node/database/macros/belongs-to-tenant.macro";
import { CallIsolationDriver } from "#node/drivers/call-isolation.driver";
import { TenantIsolationService } from "#node/services/tenant-isolation.service";
import { tenantActor } from "#testing/functions/tenant-actor.function";

/** The tenant-owned table the jobs read, made by the macro under test. */
class CreateTicketsMigration extends Migration {
  up(schema: SchemaBuilder): void {
    schema.create("tickets", (t: Blueprint) => {
      t.hasPublicId("tkt");
      t.belongsToTenant();
      t.string("title", 63).notNull().comment("What the ticket is about.");
    });
  }
}

/** The scope tree's table, with the generated policy of the scope package's own migration (minus the timestamps). */
class CreateScopeNodesMigration extends Migration {
  up(schema: SchemaBuilder): void {
    schema.createExtension(Extension.Ltree);
    schema.create("scope_nodes", (t: Blueprint) => {
      t.hasPublicId("scp");
      t.string("level", 63).notNull().comment("The key of the level the node sits at.");
      t.scopePath().notNull().comment("The node's materialised path, root first.");
      t.string("name", 200).notNull().comment("The node's display name.");
      t.rowLevelSecurity("scope_path", { setting: "app.scope_paths", match: "ancestor" });
    });
  }
}

const postgres = usePostgres({
  entities: [],
  migrations: [
    compileMigration(CreateTicketsMigration, {
      schema: "support",
      createsSchema: true,
      macros: [BelongsToTenantMacro],
    }),
    compileMigration(CreateScopeNodesMigration, { schema: "scope", createsSchema: true }),
  ],
});

/** The role every unit of work runs as: no login, no `BYPASSRLS`, not the table's owner. */
const ROLE = "stackra_probe";

const ROOT = { id: "scp_01j9z3k4m5n6p7q8r9s0t1v2a0", path: "platform" } as const;
const TENANT_A = "scp_01j9z3k4m5n6p7q8r9s0t1v2a1";
const TENANT_B = "scp_01j9z3k4m5n6p7q8r9s0t1v2b1";
const SCOPE_A: ScopeRef = { id: TENANT_A, path: "platform.acme" };
const SCOPE_B: ScopeRef = { id: TENANT_B, path: "platform.globex" };
const BRANCH: ScopeRef = { id: "scp_01j9z3k4m5n6p7q8r9s0t1v2a2", path: "platform.acme.riyadh" };
/** Well shaped, and in no tree. */
const NOWHERE: ScopeRef = { id: "scp_01j9z3k4m5n6p7q8r9s0t1v2ff", path: "platform.nowhere" };
/** A's id with B's path: a reference that names one node and grants another's rows. */
const FORGED: ScopeRef = { id: TENANT_A, path: SCOPE_B.path };

const A1 = "tkt_01j9z3k4m5n6p7q8r9s0t1v2a1";
const A2 = "tkt_01j9z3k4m5n6p7q8r9s0t1v2a2";
const B1 = "tkt_01j9z3k4m5n6p7q8r9s0t1v2b1";

/** Rows of one `select`. */
type Rows = readonly Record<string, unknown>[];

/** Runs `sql` in the running transaction as the probe role (the role ends with the transaction). */
async function probe(sql: string, params: readonly unknown[] = []): Promise<Rows> {
  const em = postgres.database.em();
  await em.execute(`set local role ${ROLE}`);
  return (await em.execute(sql, [...params])) as Rows;
}

/** The ids of every ticket the probe role can see. */
const visible = async (): Promise<string[]> =>
  (await probe('select id from "support"."tickets" order by id')).map((row) => String(row.id));

/** The entry of one `scope.scope_nodes` row. */
const entryOf = (row: Record<string, unknown>): ScopeEntry => ({
  id: String(row.id) as PublicId<"scp">,
  path: String(row.scope_path),
  level: String(row.level),
  name: String(row.name),
});

/** The scope tree over the fixture table, read as the probe role, so the table's row security decides what it shows. */
class SqlScopeTree extends Driver(ScopeTree) {
  async node(id: PublicId<"scp">): Promise<ScopeEntry | undefined> {
    const [row] = await probe(
      'select id, scope_path::text as scope_path, level, name from "scope"."scope_nodes" where id = ?',
      [id],
    );
    return row === undefined ? undefined : entryOf(row);
  }

  async byPath(path: string): Promise<ScopeEntry | undefined> {
    const [row] = await probe(
      'select id, scope_path::text as scope_path, level, name from "scope"."scope_nodes" where scope_path = ?::ltree',
      [path],
    );
    return row === undefined ? undefined : entryOf(row);
  }

  async ancestors(scope: ScopeRef): Promise<readonly ScopeEntry[]> {
    return (
      await probe(
        'select id, scope_path::text as scope_path, level, name from "scope"."scope_nodes" ' +
          "where scope_path @> ?::ltree and scope_path <> ?::ltree order by scope_path",
        [scope.path, scope.path],
      )
    ).map(entryOf);
  }

  async descendants(scope: ScopeRef): Promise<readonly ScopeEntry[]> {
    return (
      await probe(
        'select id, scope_path::text as scope_path, level, name from "scope"."scope_nodes" ' +
          "where scope_path <@ ?::ltree and scope_path <> ?::ltree order by scope_path",
        [scope.path, scope.path],
      )
    ).map(entryOf);
  }
}

/** Inserts one ticket owned by `tenant`, as the tenant, so the policy's `with check` runs on the seed too. */
async function seedTicket(id: string, tenant: string): Promise<void> {
  const isolation = new CallIsolationDriver(
    postgres.database,
    new TenantIsolationService(postgres.database),
    new SqlScopeTree(),
  );
  await isolation.run(
    tenantActor(tenant as PublicId<"scp">),
    undefined,
    () =>
      probe('insert into "support"."tickets" (id, tenant_id, title) values (?, ?, ?)', [
        id,
        tenant,
        "t",
      ]),
    { readOnly: false },
  );
}

beforeAll(async () => {
  const em = postgres.database.em();
  await em.execute(`create role ${ROLE} nologin nobypassrls`);
  await em.execute(`grant usage on schema "support" to ${ROLE}`);
  await em.execute(
    `grant select, insert, update, delete on all tables in schema "support" to ${ROLE}`,
  );
  await em.execute(`grant usage on schema "scope" to ${ROLE}`);
  await em.execute(`grant select on all tables in schema "scope" to ${ROLE}`);
  // the tree, seeded as the container's superuser (a bootstrap, outside any policy)
  const nodes: readonly [string, string, string, string][] = [
    [ROOT.id, "platform", ROOT.path, "Platform"],
    [TENANT_A, "tenant", SCOPE_A.path, "Acme"],
    [TENANT_B, "tenant", SCOPE_B.path, "Globex"],
    [BRANCH.id, "branch", BRANCH.path, "Riyadh"],
  ];
  for (const [id, level, path, name] of nodes)
    await em.execute(
      'insert into "scope"."scope_nodes" (id, level, scope_path, name) values (?, ?, ?::ltree, ?)',
      [id, level, path, name],
    );
  await seedTicket(A1, TENANT_A);
  await seedTicket(A2, TENANT_A);
  await seedTicket(B1, TENANT_B);
});

class FixedClock extends Clock {
  now(): Date {
    return new Date(Date.UTC(2026, 10, 1, 12));
  }
}

/** Allows every call: the permission step is not what these tests prove. */
class AllowAll extends Driver(AccessControl) {
  async require(): Promise<void> {}

  async authorize(): Promise<void> {}
}

/** How many times the job handler ran, so a refused job is shown not to have run. */
const handled: { count: number } = { count: 0 };

/** A declared job action: lists the tickets its isolation lets it see. */
class SurveyTicketsAction extends Action({
  key: "ticket.survey",
  actors: [ActorKind.Job],
  job: { queue: "maintenance", retries: 0 },
}) {
  async handle(): Promise<string[]> {
    handled.count += 1;
    return visible();
  }
}

/** Lists the caller's tickets. */
class ListTicketsQuery extends Query({
  key: "ticket.list_all",
  actors: [ActorKind.User],
}) {
  async handle(): Promise<string[]> {
    return visible();
  }
}

/** The real isolation over the real tree, as a deployment binds it. */
const isolationOf = () =>
  new CallIsolationDriver(
    postgres.database,
    new TenantIsolationService(postgres.database),
    new SqlScopeTree(),
  );

/** A resolver over the real isolation and unit of work, and the actions. */
function resolverOf(): Resolver {
  const bound = new Map<AnyClass, object>([
    [AccessControl, new AllowAll()],
    [UnitOfWork, new DatabaseUnitOfWorkDriver()],
    [CallIsolation, isolationOf()],
    [SurveyTicketsAction, new SurveyTicketsAction()],
    [ListTicketsQuery, new ListTicketsQuery()],
  ]);
  return {
    has: (type) => bound.has(type),
    get: <U extends object>(type: AnyClass<U>) => bound.get(type) as U,
  };
}

/** A queue and a connected worker over a memory store, with the real isolation bound. */
function workerSetUp() {
  const clock = new FixedClock();
  const store = new MemoryQueueDriver();
  const worker = new QueueWorkerService(store, clock);
  worker.connect(resolverOf());
  handled.count = 0;
  return { queue: new QueueService(store, clock), worker };
}

/** The scheduler's stamp for a schedule in `scope`, as `scheduler.service.ts` builds it. */
const schedulerActor = (scope: ScopeRef): Actor => ({
  kind: ActorKind.System,
  id: "sys_scheduler",
  scopeId: scope.id,
});

/** Pushes the survey job with `options`, runs it and returns its one run. */
async function survey(options: {
  readonly scope: ScopeRef;
  readonly origin?: Actor;
}): Promise<{ readonly outcome: string; readonly output?: unknown; readonly error?: unknown }> {
  const { queue, worker } = workerSetUp();
  await queue.push(SurveyTicketsAction, {}, options);
  const [run] = await worker.drain();
  if (run === undefined) throw new Error("the job did not run");
  return run;
}

describe("a job's tenant on Postgres", () => {
  it("shows a job pushed with tenant A's scope and no origin only A's rows", async () => {
    const run = await survey({ scope: SCOPE_A });
    expect(run.outcome).toBe(JobOutcome.Done);
    expect(run.output).toEqual([A1, A2]);
  });

  it("shows a job pushed with a branch of A and no origin only A's rows: the branch resolves to its parent tenant", async () => {
    const run = await survey({ scope: BRANCH });
    expect(run.outcome).toBe(JobOutcome.Done);
    expect(run.output).toEqual([A1, A2]);
  });

  it("shows a schedule stored in the branch only A's rows, though the scheduler's actor names the branch id", async () => {
    const run = await survey({ scope: BRANCH, origin: schedulerActor(BRANCH) });
    expect(run.outcome).toBe(JobOutcome.Done);
    expect(run.output).toEqual([A1, A2]);
  });

  it("shows tenant B's scope only B's rows", async () => {
    const run = await survey({ scope: SCOPE_B });
    expect(run.output).toEqual([B1]);
  });

  it("refuses a job queued by a user of B in A's scope, instead of silently taking A", async () => {
    const run = await survey({ scope: SCOPE_A, origin: tenantActor(TENANT_B as PublicId<"scp">) });
    expect(run.outcome).not.toBe(JobOutcome.Done);
    expect(isRefusal(run.error, TenantScopeMismatchError)).toBe(true);
    expect(handled.count).toBe(0);
  });

  it("runs a job queued by a user of A in a branch of A as A", async () => {
    const run = await survey({ scope: BRANCH, origin: tenantActor(TENANT_A as PublicId<"scp">) });
    expect(run.output).toEqual([A1, A2]);
  });

  it("refuses a job whose scope the tree does not show, and never runs its handler", async () => {
    const run = await survey({ scope: NOWHERE });
    expect(run.outcome).not.toBe(JobOutcome.Done);
    expect(isRefusal(run.error, TenantScopeUnresolvedError)).toBe(true);
    expect(handled.count).toBe(0);
  });

  it("refuses a scope whose id is A's and whose path is B's, so a forged reference reads neither tenant", async () => {
    const run = await survey({ scope: FORGED });
    expect(run.outcome).not.toBe(JobOutcome.Done);
    expect(isRefusal(run.error, TenantScopeUnresolvedError)).toBe(true);
    expect(handled.count).toBe(0);
  });

  it("refuses to queue a scope that is not a ScopeRef", async () => {
    const { queue } = workerSetUp();
    const forged = "platform.acme" as unknown as ScopeRef;
    await expect(queue.push(SurveyTicketsAction, {}, { scope: forged })).rejects.toSatisfy(
      (error: unknown) => isRefusal(error, ScopeNotPlatformWrittenError),
    );
  });
});

/** What `actor` sees through the list query in `scope`. */
const list = (actor: Actor, scope?: ScopeRef) =>
  new ActionPipeline(resolverOf()).execute(
    ListTicketsQuery,
    {},
    { actor, ...(scope === undefined ? {} : { scope }) },
  );

describe("a user's tenant on Postgres", () => {
  it("shows a user of A in scope A, and in a branch of A, only A's rows", async () => {
    const user = tenantActor(TENANT_A as PublicId<"scp">);
    expect(await list(user, SCOPE_A)).toEqual([A1, A2]);
    expect(await list(user, BRANCH)).toEqual([A1, A2]);
  });

  it("refuses a user of A in B's scope instead of choosing a tenant", async () => {
    await expect(list(tenantActor(TENANT_A as PublicId<"scp">), SCOPE_B)).rejects.toSatisfy(
      (error: unknown) => isRefusal(error, TenantScopeMismatchError),
    );
  });

  it("refuses a user of A in the root scope, above every tenant, and lets a platform user list there", async () => {
    await expect(list(tenantActor(TENANT_A as PublicId<"scp">), ROOT)).rejects.toSatisfy(
      (error: unknown) => isRefusal(error, TenantScopeMismatchError),
    );
    const staff: Actor = {
      kind: ActorKind.User,
      id: "usr_00000000000000000000000000",
      realm: Realm.Staff,
    };
    expect(await list(staff, ROOT)).toEqual([]);
  });
});

describe("why the tree is read from the root of the scope's path", () => {
  it("hides a branch's tenant from the branch's own scope session, and shows it from the root's", async () => {
    const { database } = postgres;
    const tree = new SqlScopeTree();
    expect(
      await database.withScope(BRANCH, () => tree.node(TENANT_A as PublicId<"scp">)),
    ).toBeUndefined();
    expect(
      (await database.withScope(ROOT, () => tree.node(TENANT_A as PublicId<"scp">)))?.level,
    ).toBe("tenant");
  });
});

/** The three scope settings of the running transaction. */
async function scopeSettings(): Promise<readonly (string | null)[]> {
  const [row] = (await postgres.database
    .em()
    .execute(
      "select current_setting('app.scope_id', true) as id, current_setting('app.scope_path', true) as path, " +
        "current_setting('app.scope_paths', true) as paths",
    )) as { id: string | null; path: string | null; paths: string | null }[];
  return [row?.id ?? null, row?.path ?? null, row?.paths ?? null];
}

describe("a refusal inside a held transaction", () => {
  const job: Actor = { kind: ActorKind.Job, id: "job_01j9z3k4m5n6p7q8r9s0t1v2w3" };

  it("leaves the scope settings exactly as they were, so a caller that catches it still sees only its own scope", async () => {
    const { database } = postgres;
    const refusals: readonly [Actor, ScopeRef][] = [
      [job, NOWHERE],
      [job, FORGED],
      [tenantActor(TENANT_A as PublicId<"scp">), SCOPE_B],
      [tenantActor(TENANT_B as PublicId<"scp">), BRANCH],
    ];
    await database.transaction(() =>
      // the caller's own scope session, inside a held transaction so each refusal runs in a savepoint
      database.withScope(BRANCH, async () => {
        const before = await scopeSettings();
        expect(before).toEqual([BRANCH.id, BRANCH.path, BRANCH.path]);
        for (const [who, at] of refusals) {
          await expect(
            isolationOf().run(who, at, async () => "ran", { readOnly: false }),
          ).rejects.toBeDefined();
          expect(await scopeSettings()).toEqual(before);
        }
      }),
    );
  });
});
