/**
 * Stackra file contract:
 * Purpose: the isolation test of the background units under the real `CallIsolationDriver` on real Postgres row
 *          security (STA-1717, ADR 0495 decision 2): the queue worker over the Postgres queue, the outbox relay over
 *          the Postgres outbox (a watched row change handed to its consumer, and an event fanned out to another app's
 *          deliveries), and the inbox over the Postgres inbox, each run on a connection that logs in as a NOBYPASSRLS
 *          role owning none of the tables, over tickets of tenants A and B and a real scope tree. A job, a consumer's
 *          delivery and a receipt queued, written or sent in tenant A's call see only A's tickets, B's only B's, and a
 *          platform receipt none; each row a unit writes carries its tenant from the session, never from input. A job
 *          queued in A's call for B's scope, and a receipt from a user of B in A's scope, are refused with their
 *          handler or listener never run and nothing recorded (where `ScopeOwnership` is bound, that receipt is
 *          downgraded to the platform actor, which runs in the scope's tenant). `TenantScopeOwnershipDriver` trusts a
 *          tenant's user in a branch of its tenant outside every scope session and inside the branch's own, which
 *          its tree read from the root needs (it denied both before), and puts the caller's session back. After every
 *          unit, each connection it used carries no `app.*` setting and no role but its own.
 * Boundary: integration tier (`.int`): needs Docker for Testcontainers. The container's superuser applies every
 *           migration (the ticket and tree tables here, the outbox's and the queue's found by their path, as gen
 *           finds them), seeds the tree and the tickets, and checks rows past row security; everything under test runs
 *           on `service`, the login role's own pool of two, which is also `Database.current()`. Locks are in memory,
 *           the clock is the system's, the permission step allows every call and no HTTP is sent.
 * Runtime: node (vitest)
 * Governing contract: ADR 0495 (decisions 1 to 3, the note of 2026-11-01); ADR 0239 (2026-11-07 amendment, gaps A
 *                     and C); ADR 0511 (decision 12); ADR 0182 (integration tier); ADR 0022; ADR 0269;
 *                     `.agents/rules/tenancy.md` (points 6 to 8).
 */
import { randomUUID } from "node:crypto";

import { Action } from "@stackra/actions";
import type { Resolver } from "@stackra/actions";
import {
  AccessControl,
  CallIsolation,
  ScopeOwnership,
  UnitOfWork,
} from "@stackra/actions/contracts";
import { buildConfig } from "@stackra/config";
import { type AnyClass, Driver } from "@stackra/container";
import { ActorKind, Clock, Logger, mintPublicId, Realm } from "@stackra/contracts";
import type { Actor, PublicId, ScopeRef } from "@stackra/contracts";
import { compileMigration, Database } from "@stackra/database";
import { DatabaseUnitOfWorkDriver, PostgresDatabaseDriver } from "@stackra/database/node";
import { usePostgres } from "@stackra/database/testing";
import { isRefusal } from "@stackra/errors";
import { EventBus, IntegrationEvent, Listener } from "@stackra/events";
import { Locks, MemoryLockDriver } from "@stackra/locking";
import { OutboxConfig, registerChangeConsumers, registerEventNames } from "@stackra/outbox";
import {
  EventPublisher,
  MessageKind,
  RowChangeKind,
  SubscriberSource,
} from "@stackra/outbox/contracts";
import type {
  EventEnvelope,
  OutboxMessage,
  RowChange,
  Subscriber,
} from "@stackra/outbox/contracts";
import {
  CrossAppFanOut,
  InboxService,
  OutboxRelayService,
  PostgresChangeFeedDriver,
  PostgresDeliveryDriver,
  PostgresInboxDriver,
  PostgresOutboxDriver,
} from "@stackra/outbox/node";
import { JobOutcome, QueueService } from "@stackra/queue";
import { PostgresQueueDriver, QueueWorkerService } from "@stackra/queue/node";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "@stackra/testing";
import { registerSchemas } from "@stackra/validation";
import { z } from "zod";

import { TenantScopeOwnershipDriver } from "#core/drivers/tenant-scope-ownership.driver";
import { TenantScopeMismatchError } from "#core/errors/tenant-scope-mismatch.error";
import { BelongsToTenantMacro } from "#node/database/macros/belongs-to-tenant.macro";
import { CallIsolationDriver } from "#node/drivers/call-isolation.driver";
import {
  applyMigration,
  backendOf,
  connectAs,
  CreateScopeTreeMigration,
  CreateTicketsMigration,
  expectCleanBackends,
  packageMigrations,
  SqlScopeTree,
} from "#node/drivers/__tests__/fixtures/background-postgres.fixture";
import { TenantIsolationService } from "#node/services/tenant-isolation.service";
import { tenantIsolationOptions } from "#testing/functions/tenant-isolation-options.function";

const postgres = usePostgres({
  entities: [],
  migrations: [
    compileMigration(CreateTicketsMigration, {
      schema: "support",
      createsSchema: true,
      macros: [BelongsToTenantMacro],
    }),
    compileMigration(CreateScopeTreeMigration, { schema: "scope", createsSchema: true }),
  ],
});

/** The role the service logs in as: no `BYPASSRLS`, owner of no table. */
const ROLE = tenantIsolationOptions().role;

/** How many connections the service's pool holds. */
const POOL = 2;

const ROOT = { id: "scp_01j9z3k4m5n6p7q8r9s0t1v2c0", path: "platform" } as const;
const TENANT_A = "scp_01j9z3k4m5n6p7q8r9s0t1v2c1" as PublicId<"scp">;
const TENANT_B = "scp_01j9z3k4m5n6p7q8r9s0t1v2d1" as PublicId<"scp">;
const SCOPE_A: ScopeRef = { id: TENANT_A, path: "platform.acme" };
const SCOPE_B: ScopeRef = { id: TENANT_B, path: "platform.globex" };
const BRANCH_A: ScopeRef = { id: "scp_01j9z3k4m5n6p7q8r9s0t1v2c2", path: "platform.acme.riyadh" };

const A1 = "tkt_01j9z3k4m5n6p7q8r9s0t1v2c1";
const A2 = "tkt_01j9z3k4m5n6p7q8r9s0t1v2c2";
const B1 = "tkt_01j9z3k4m5n6p7q8r9s0t1v2d1";

/** A staff user of `tenant`. */
const userOf = (tenant: PublicId<"scp">, id: PublicId<"usr">): Actor =>
  Object.freeze({ kind: ActorKind.User, id, realm: Realm.Staff, scopeId: tenant });

const USER_A = userOf(TENANT_A, "usr_01j9z3k4m5n6p7q8r9s0t1v2c1");
const USER_B = userOf(TENANT_B, "usr_01j9z3k4m5n6p7q8r9s0t1v2d1");

/** The wire name of the integration event the inbox and the fan-out carry. */
const TOUCHED = "support.ticket.touched.v1";

/** The login role's connection, set up in `beforeAll`. */
const state: { service?: PostgresDatabaseDriver } = {};

/** The login role's connection. */
function service(): PostgresDatabaseDriver {
  if (state.service === undefined) throw new Error("the service connection is not set up");
  return state.service;
}

/** Every backend a unit ran a statement on since the last check. */
const used = new Set<number>();

/** What one unit saw: the tickets its isolation shows, recorded with the backend it ran on. */
async function look(): Promise<string[]> {
  used.add(await backendOf(service()));
  // raw-sql: the probe's own read of the tenant-owned table, under the unit's isolation
  const rows = (await service().em().execute('select id from "support"."tickets" order by id')) as {
    id: string;
  }[];
  return rows.map((row) => row.id);
}

/** The real isolation on the service connection over the real tree, as a deployment binds it. */
const isolationOf = () =>
  new CallIsolationDriver(
    service(),
    new TenantIsolationService(service()),
    new SqlScopeTree(service()),
  );

/** Runs `work` in `actor`'s call in `scope`, as the action pipeline opens one. */
const inCall = <T>(actor: Actor, scope: ScopeRef, work: () => Promise<T>) =>
  isolationOf().run(actor, scope, work, { readOnly: false });

/** Runs `sql` as the container's superuser, past row security: a seed or a check. */
const superuser = (sql: string, params: readonly unknown[] = []) =>
  postgres.database.em().execute(sql, [...params]) as Promise<Record<string, unknown>[]>;

/** A resolver binding `bound`. */
const resolverOf = (bound: readonly (readonly [AnyClass, object])[]): Resolver => {
  const map = new Map<AnyClass, object>(bound);
  return {
    has: (type) => map.has(type),
    get: <T extends object>(type: AnyClass<T>) => map.get(type) as T,
  };
};

class SystemClock extends Clock {
  now(): Date {
    return new Date();
  }
}

/** Allows every call: the permission step is not what these tests prove. */
class AllowAll extends Driver(AccessControl) {
  async require(): Promise<void> {}

  async authorize(): Promise<void> {}
}

/** Keeps every warning, so a downgraded actor shows. */
class RecordingLogger extends Driver(Logger) {
  readonly warnings: string[] = [];

  debug(): void {}

  info(): void {}

  warn(event: string): void {
    this.warnings.push(event);
  }

  error(): void {}
}

beforeAll(async () => {
  const em = postgres.database.em();
  // the role the system functions are granted to, before the migrations that grant to it
  await em.execute("create role stackra_system_access nologin nobypassrls");
  // a migrator's own connection, closed before the service connects
  const migrator = await PostgresDatabaseDriver.connect({ url: postgres.url, entities: [] });
  for (const migration of [
    ...(await packageMigrations("@stackra/outbox", "outbox")),
    ...(await packageMigrations("@stackra/queue", "queue")),
  ])
    await applyMigration(migrator, migration);
  await migrator.close();
  const password = randomUUID();
  await em.execute(`create role ${ROLE} login nobypassrls password '${password}'`);
  for (const schema of ["support", "outbox", "queue"]) {
    await em.execute(`grant usage on schema "${schema}" to ${ROLE}`);
    await em.execute(
      `grant select, insert, update, delete on all tables in schema "${schema}" to ${ROLE}`,
    );
    await em.execute(`grant usage, select on all sequences in schema "${schema}" to ${ROLE}`);
    await em.execute(`grant execute on all functions in schema "${schema}" to ${ROLE}`);
  }
  await em.execute(`grant usage on schema "scope" to ${ROLE}`);
  await em.execute(`grant select on all tables in schema "scope" to ${ROLE}`);
  // the tree and the tickets, seeded as the superuser (a bootstrap, outside any policy)
  for (const [id, level, path, name] of [
    [ROOT.id, "platform", ROOT.path, "Platform"],
    [TENANT_A, "tenant", SCOPE_A.path, "Acme"],
    [TENANT_B, "tenant", SCOPE_B.path, "Globex"],
    [BRANCH_A.id, "branch", BRANCH_A.path, "Riyadh"],
  ])
    await em.execute(
      'insert into "scope"."scope_nodes" (id, level, scope_path, name) values (?, ?, ?::ltree, ?)',
      [id, level, path, name],
    );
  for (const [id, tenant] of [
    [A1, TENANT_A],
    [A2, TENANT_A],
    [B1, TENANT_B],
  ])
    await em.execute('insert into "support"."tickets" (id, tenant_id, title) values (?, ?, ?)', [
      id,
      tenant,
      "t",
    ]);
  // last connected is `Database.current()`, so the unit of work runs on the service's connection too
  state.service = await connectAs(postgres.url, ROLE, password, POOL);
}, 300_000);

afterAll(async () => {
  await state.service?.close();
});

beforeEach(() => {
  used.clear();
});

describe("a connection as the service role", () => {
  it("owns no table, cannot bypass row security, and sees no tenant row outside a call", async () => {
    expect(
      await superuser(
        "select rolbypassrls as bypass, rolsuper as super from pg_roles where rolname = ?",
        [ROLE],
      ),
    ).toEqual([{ bypass: false, super: false }]);
    expect(
      await superuser(
        "select count(*)::int as n from pg_tables where tableowner = ? and schemaname in ('support', 'outbox', 'queue')",
        [ROLE],
      ),
    ).toEqual([{ n: 0 }]);
    // raw-sql: a read with no isolation at all
    expect(await service().em().execute('select id from "support"."tickets"')).toEqual([]);
  });
});

/** The real scope ownership over the real tree, on the service connection. */
const ownership = () => new TenantScopeOwnershipDriver(new SqlScopeTree(service()), service());

describe("the scope ownership on Postgres", () => {
  it("trusts a tenant's user in a branch of its tenant outside every scope session and inside the branch's own", async () => {
    await expect(ownership().holds(USER_A, BRANCH_A)).resolves.toBe(true);
    await expect(
      service().withScope(BRANCH_A, () => ownership().holds(USER_A, BRANCH_A)),
    ).resolves.toBe(true);
    await expect(ownership().holds(USER_A, SCOPE_A)).resolves.toBe(true);
  });

  it("trusts no other tenant's user, and no tenant user above every tenant or with no scope", async () => {
    await expect(ownership().holds(USER_B, BRANCH_A)).resolves.toBe(false);
    await expect(ownership().holds(USER_A, SCOPE_B)).resolves.toBe(false);
    await expect(ownership().holds(USER_A, ROOT)).resolves.toBe(false);
    await expect(ownership().holds(USER_A, undefined)).resolves.toBe(false);
  });

  it("puts the caller's own scope session back after reading the tree from the root", async () => {
    const after = await service().withScope(BRANCH_A, async () => {
      await ownership().holds(USER_A, BRANCH_A);
      used.add(await backendOf(service()));
      // raw-sql: the session's own settings and what its row security shows, read back after the check
      return service()
        .em()
        .execute(
          "select current_setting('app.scope_paths', true) as paths, " +
            '(select count(*)::int from "scope"."scope_nodes") as nodes',
        );
    });
    expect(after).toEqual([{ paths: BRANCH_A.path, nodes: 1 }]);
    await expectCleanBackends(service(), ROLE, used, POOL);
  });
});

/** How many times the job handler ran, so a refused job is shown not to have run. */
const handled: { count: number } = { count: 0 };

/** A declared job action: lists the tickets its isolation lets it see. */
class SurveyTicketsAction extends Action({
  key: "ticket.survey",
  actors: [ActorKind.Job],
  job: { queue: "survey", retries: 0, deadLetter: true },
}) {
  async handle(): Promise<string[]> {
    handled.count += 1;
    return look();
  }
}

describe("the queue worker under the isolation driver", () => {
  const clock = new SystemClock();
  const queue = () => new QueueService(new PostgresQueueDriver(service()), clock);
  const worker = () => {
    const each = new QueueWorkerService(new PostgresQueueDriver(service()), clock);
    each.connect(
      resolverOf([
        [AccessControl, new AllowAll()],
        [UnitOfWork, new DatabaseUnitOfWorkDriver()],
        [CallIsolation, isolationOf()],
        [Database, service()],
        [SurveyTicketsAction, new SurveyTicketsAction()],
      ]),
    );
    return each;
  };

  /** Queues the survey in `user`'s call in `scope`, for `jobScope` (the call's scope by default); its id. */
  const pushIn = (user: Actor, scope: ScopeRef, jobScope: ScopeRef = scope) =>
    inCall(user, scope, () =>
      queue().push(SurveyTicketsAction, {}, { scope: jobScope, origin: user }),
    );

  beforeEach(() => {
    handled.count = 0;
  });

  it("runs each tenant's job in its tenant: the job sees only its rows, its row took the tenant of the call", async () => {
    const a = await pushIn(USER_A, SCOPE_A);
    const branch = await pushIn(USER_A, BRANCH_A);
    const b = await pushIn(USER_B, SCOPE_B);
    expect(
      new Map(
        (await superuser("select id, tenant_id from queue.jobs where queue = 'survey'")).map(
          (row) => [row["id"], row["tenant_id"]],
        ),
      ),
    ).toEqual(
      new Map([
        [a, TENANT_A],
        [branch, TENANT_A],
        [b, TENANT_B],
      ]),
    );
    const runs = await worker().drain("survey");
    expect(new Map(runs.map((run) => [run.job.id, [run.outcome, run.output]]))).toEqual(
      new Map([
        [a, [JobOutcome.Done, [A1, A2]]],
        [branch, [JobOutcome.Done, [A1, A2]]],
        [b, [JobOutcome.Done, [B1]]],
      ]),
    );
    expect(await superuser("select id from queue.jobs where queue = 'survey'")).toEqual([]);
    await expectCleanBackends(service(), ROLE, used, POOL);
  });

  it("refuses a job queued in tenant A's call for B's scope: its handler never runs and its dead letter stays A's", async () => {
    const forged = await pushIn(USER_A, SCOPE_A, SCOPE_B);
    const [run] = await worker().drain("survey");
    expect(run?.job.id).toBe(forged);
    expect(run?.outcome).not.toBe(JobOutcome.Done);
    expect(isRefusal(run?.error, TenantScopeMismatchError)).toBe(true);
    expect(handled.count).toBe(0);
    expect(
      await superuser("select status, tenant_id from queue.jobs where id = ?", [forged]),
    ).toEqual([{ status: "dead", tenant_id: TENANT_A }]);
    used.add(await backendOf(service()));
    await expectCleanBackends(service(), ROLE, used, POOL);
    await superuser("delete from queue.jobs where queue = 'survey'");
  });
});

/** The model a watched row change names. */
class Ticket {}

/** What each delivered change saw, by the changed row's id. */
const consumed = new Map<string, string[]>();

/** Lists, for each change it is handed, the tickets its isolation lets it see. */
class TicketWatcher {
  async consume(change: RowChange): Promise<void> {
    consumed.set(change.id, await look());
  }
}

registerChangeConsumers([[Ticket, TicketWatcher]]);

class TicketTouched extends IntegrationEvent({ name: "ticket.touched" }) {
  ticketId!: string;
}

registerSchemas([[TicketTouched, z.object({ ticketId: z.string() })]]);
registerEventNames([{ type: TicketTouched, name: TOUCHED }]);

/** Keeps what it publishes; the transport is not what these tests prove. */
class RecordingPublisher extends Driver(EventPublisher) {
  readonly published: string[] = [];

  async publish(envelope: EventEnvelope): Promise<void> {
    this.published.push(envelope.id);
  }
}

/** One other app taking the touched event. */
class OneSubscriber extends Driver(SubscriberSource) {
  async subscribersOf(type: string): Promise<readonly Subscriber[]> {
    return type === TOUCHED
      ? [{ member: "billing", inbox: "http://127.0.0.1:9", events: [TOUCHED] }]
      : [];
  }
}

/** Writes one due message of `kind` in `user`'s call in `scope`, as the outbox writer does at commit; its id. */
const writeIn = async (
  user: Actor,
  scope: ScopeRef,
  kind: MessageKind,
  data: unknown,
): Promise<PublicId<"evt">> => {
  const id = mintPublicId("evt");
  const message: OutboxMessage = {
    id,
    kind,
    type: kind === MessageKind.Change ? "Ticket" : TOUCHED,
    data,
    meta: { actor: user, correlationId: `call-${id}` },
    occurredAt: new Date(),
    attempts: 0,
    availableAt: new Date(Date.now() - 1000),
  };
  await inCall(user, scope, () => new PostgresOutboxDriver(service()).write([message]));
  return id;
};

/** A change to ticket `id`. */
const changeOf = (id: string): RowChange => ({
  model: "Ticket",
  id,
  kind: RowChangeKind.Updated,
  fields: ["title"],
});

describe("the outbox relay under the isolation driver", () => {
  const clock = new SystemClock();
  const relayOf = (bound: readonly (readonly [AnyClass, object])[]) => {
    const relay = new OutboxRelayService(
      new PostgresOutboxDriver(service()),
      new PostgresChangeFeedDriver(service()),
      new RecordingPublisher(),
      new Locks(new MemoryLockDriver(clock), clock),
      service(),
      clock,
      buildConfig(OutboxConfig, { values: { batchWindowSeconds: 0 } }),
    );
    relay.connect(resolverOf([[CallIsolation, isolationOf()], ...bound]));
    return relay;
  };

  it("hands each tenant's row change to its consumer in that tenant, which sees only its rows", async () => {
    consumed.clear();
    const a = await writeIn(USER_A, BRANCH_A, MessageKind.Change, changeOf(A1));
    const b = await writeIn(USER_B, SCOPE_B, MessageKind.Change, changeOf(B1));
    expect(
      await superuser(
        "select id, tenant_id, scope_id from outbox.messages where id in (?, ?) order by tenant_id",
        [a, b],
      ),
    ).toEqual([
      { id: a, tenant_id: TENANT_A, scope_id: BRANCH_A.id },
      { id: b, tenant_id: TENANT_B, scope_id: TENANT_B },
    ]);
    await expect(relayOf([[TicketWatcher, new TicketWatcher()]]).relay()).resolves.toBe(2);
    expect(consumed).toEqual(
      new Map([
        [A1, [A1, A2]],
        [B1, [B1]],
      ]),
    );
    expect(await superuser("select id from outbox.messages")).toEqual([]);
    await expectCleanBackends(service(), ROLE, used, POOL);
  });

  it("fans each tenant's event out to deliveries of that tenant, which another tenant's call cannot see", async () => {
    const a = await writeIn(USER_A, SCOPE_A, MessageKind.Event, { ticketId: A1 });
    const b = await writeIn(USER_B, SCOPE_B, MessageKind.Event, { ticketId: B1 });
    const fanOut = new CrossAppFanOut(new OneSubscriber(), new PostgresDeliveryDriver(service()));
    await expect(relayOf([[CrossAppFanOut, fanOut]]).relay()).resolves.toBe(2);
    expect(
      await superuser("select event_id, tenant_id from outbox.deliveries order by tenant_id"),
    ).toEqual([
      { event_id: a, tenant_id: TENANT_A },
      { event_id: b, tenant_id: TENANT_B },
    ]);
    const deliveriesIn = (user: Actor, scope: ScopeRef) =>
      inCall(user, scope, async () => {
        used.add(await backendOf(service()));
        // raw-sql: the probe's own read of the tenant-owned deliveries, under the call's isolation
        return service().em().execute("select event_id from outbox.deliveries");
      });
    expect(await deliveriesIn(USER_A, SCOPE_A)).toEqual([{ event_id: a }]);
    expect(await deliveriesIn(USER_B, SCOPE_B)).toEqual([{ event_id: b }]);
    await expectCleanBackends(service(), ROLE, used, POOL);
    await superuser("delete from outbox.deliveries");
  });
});

/** What each received event's listener saw, by ticket id. */
const heard = new Map<string, string[]>();

/** Lists, for each touched ticket it hears of, the tickets its isolation lets it see. */
class TouchedListener extends Listener {
  async handle(event: TicketTouched): Promise<void> {
    heard.set(event.ticketId, await look());
  }
}

/** An envelope of a touched `ticketId` from `actor` in `scope` (each absent: none). */
const envelopeOf = (ticketId: string, actor?: Actor, scope?: ScopeRef): EventEnvelope => ({
  id: mintPublicId("evt"),
  type: TOUCHED,
  occurredAt: new Date().toISOString(),
  ...(scope === undefined ? {} : { scope }),
  meta: { correlationId: `call-${ticketId}`, ...(actor === undefined ? {} : { actor }) },
  data: { ticketId },
});

/** Whether the inbox recorded `id` as received. */
const received = async (id: string) =>
  (await superuser('select event_id from "outbox"."inbox" where event_id = ?', [id])).length === 1;

describe("the inbox under the isolation driver", () => {
  const clock = new SystemClock();

  /** An inbox on the service connection with the isolation, a logger and, when `trusting`, the scope ownership. */
  const inboxOf = (trusting: boolean) => {
    const bus = new EventBus(clock);
    bus.subscribe(TicketTouched, new TouchedListener());
    const logger = new RecordingLogger();
    const inbox = new InboxService(new PostgresInboxDriver(service()), bus, service(), clock);
    inbox.connect(
      resolverOf([
        [CallIsolation, isolationOf()],
        [Logger, logger],
        ...(trusting ? [[ScopeOwnership, ownership()] as const] : []),
      ]),
    );
    return { inbox, logger };
  };

  beforeEach(() => {
    heard.clear();
  });

  it("runs each receipt in its sender's tenant, trusted by the scope ownership: a listener sees only that tenant's rows", async () => {
    const { inbox, logger } = inboxOf(true);
    const fromA = envelopeOf(A1, USER_A, BRANCH_A);
    const fromB = envelopeOf(B1, USER_B, SCOPE_B);
    const platform = envelopeOf("tkt_platform");
    for (const envelope of [fromA, fromB, platform])
      await expect(inbox.receive(envelope)).resolves.toBe(true);
    expect(heard).toEqual(
      new Map([
        [A1, [A1, A2]],
        [B1, [B1]],
        ["tkt_platform", []],
      ]),
    );
    // a user of the tenant that owns the scope is trusted, not downgraded to the platform actor
    expect(logger.warnings).toEqual([]);
    for (const envelope of [fromA, fromB, platform]) expect(await received(envelope.id)).toBe(true);
    await expectCleanBackends(service(), ROLE, used, POOL);
  });

  it("refuses a receipt from a user of B in A's scope: no listener runs and the receipt is not recorded", async () => {
    const { inbox } = inboxOf(false);
    const forged = envelopeOf(A1, USER_B, SCOPE_A);
    await expect(inbox.receive(forged)).rejects.toSatisfy((error: unknown) =>
      isRefusal(error, TenantScopeMismatchError),
    );
    expect(heard).toEqual(new Map());
    expect(await received(forged.id)).toBe(false);
    used.add(await backendOf(service()));
    await expectCleanBackends(service(), ROLE, used, POOL);
  });

  it("downgrades that receipt to the platform actor where the scope ownership is bound, which never reads B's rows", async () => {
    const { inbox, logger } = inboxOf(true);
    const forged = envelopeOf(A1, USER_B, SCOPE_A);
    await expect(inbox.receive(forged)).resolves.toBe(true);
    expect(logger.warnings).toEqual(["outbox.actor_downgraded"]);
    // the platform actor runs in the tenant of the envelope's scope (ADR 0495 note of 2026-11-01), never in B's
    expect(heard).toEqual(new Map([[A1, [A1, A2]]]));
    await expectCleanBackends(service(), ROLE, used, POOL);
  });
});
