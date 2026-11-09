/**
 * Stackra file contract:
 * Purpose: the isolation test of the workflow journal's tenant-owned tables on real Postgres, each hot path run by the
 *          native engine on a NOBYPASSRLS service role's connection over runs of two owners and a platform (NULL) run.
 *          A run started in an owner's session is owned by it, its steps too, and a session with no owner reads only
 *          the platform's rows directly while the tick's claim reaches every owner's due run. The tick (outside any
 *          transaction, as the worker runs it) loads each claimed run in its owner, resumes it on a signal held in
 *          that owner (never another's with the same key and correlation) and saves every step and the run there. It
 *          refuses an owned run with no isolation bound and fails on a claimed run that does not load, never skipping
 *          either. Expiry claims lapsed signals of every owner and removes them per owner, the system-access role
 *          holding no DELETE. `workflow.run.get` answers `run_not_found` to another owner's session, as to a caller the
 *          query's own check refuses. A run a system actor that names no tenant starts in an owner's session (an
 *          event's run) takes that owner for its steps and completes there.
 * Boundary: integration tier (`.int`): runs only where `TESTBED_POSTGRES_HOST` names a Postgres and is skipped elsewhere.
 *           One fresh database for the file (`ownerPostgres`); the superuser seeds and reads, everything under test
 *           runs as the service role (`asService`, `OwnerIsolation`). Tests share the database and run in order.
 * Runtime: node (vitest)
 * Governing contract: ADR 0239 (2026-11-07 amendment, gaps A and C); ADR 0495; ADR 0102 (decision 1); ADR 0182
 *                     (integration tier); `.agents/rules/tenancy.md` (points 7 and 8).
 */
import type { QueryContext, Resolver } from "@stackra/actions";
import { CallIsolation } from "@stackra/actions/contracts";
import type { AnyClass } from "@stackra/container";
import { type Actor, ActorKind, Clock, type PublicId, type ScopeRef } from "@stackra/contracts";
import { Locks, MemoryLockDriver } from "@stackra/locking";
import { ClaimNotLoadedError, RowIsolationMissingError } from "@stackra/outbox";
import { afterAll, beforeAll, describe, expect, it } from "@stackra/testing";

import { Signal } from "#core/bases/signal.base";
import { Workflow } from "#core/bases/workflow.base";
import { Step } from "#core/decorators/step.decorator";
import { NativeWorkflowRunnerDriver } from "#core/drivers/native-workflow-runner.driver";
import { RunNotFoundError } from "#core/errors/run-not-found.error";
import type { Run } from "#core/types/run.type";
import type { RunOrigin } from "#core/types/run-origin.type";
import type { StepContext } from "#core/types/step-context.type";
import {
  asService,
  HOST,
  OwnerIsolation,
  ownerPostgres,
} from "#node/__tests__/fixtures/owner-postgres.fixture";
import type { OwnerPostgres } from "#node/__tests__/fixtures/owner-postgres.fixture";
import { PostgresWorkflowJournalDriver } from "#node/drivers/postgres-workflow-journal.driver";
import { GetRunQuery } from "#node/queries/get-run.query";

/** Two owners (tenant nodes). */
const ACME = "scp_01jab3k4m5n6p7q8r9s0t1v2w3" as PublicId<"scp">;
const GLOBEX = "scp_01jab3k4m5n6p7q8r9s0t1v2w4" as PublicId<"scp">;

const MINUTE = 60_000;

class SystemClock extends Clock {
  now(): Date {
    return new Date();
  }
}

class Shipped extends Signal {
  by!: string;
}

class ShipWorkflow extends Workflow<{ readonly orderId: string }>({ timeout: "1h" }) {
  @Step<ShipWorkflow>({
    waitFor: Shipped,
    correlate: (run) => ({ orderId: run.input.orderId }),
    timeout: "30m",
  })
  async ship(_run: Run<this>, _ctx: StepContext, shipped: Shipped): Promise<string> {
    return shipped.by;
  }

  async close(run: Run<this>): Promise<string> {
    return `closed:${run.results.ship}`;
  }
}

class NoteWorkflow extends Workflow<{ readonly text: string }>({ timeout: "1h" }) {
  async write(run: Run<this>): Promise<string> {
    return run.input.text;
  }

  async seal(run: Run<this>): Promise<string> {
    return `sealed:${run.results.write}`;
  }
}

/** The origin of a run started by a system actor of `owner` (none: the platform's). */
const originOf = (owner: PublicId<"scp"> | undefined): RunOrigin => ({
  callId: "call-1",
  key: "order.ship",
  actor: {
    kind: ActorKind.System,
    id: "sys_test",
    ...(owner === undefined ? {} : { scopeId: owner }),
  } as Actor,
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

/** An isolation that always sets `owner`, whatever the actor: a broken one. */
class WrongOwnerIsolation extends OwnerIsolation {
  override run<T>(
    actor: Actor,
    scope: ScopeRef | readonly ScopeRef[] | undefined,
    work: (actor?: Actor) => Promise<T>,
  ): Promise<T> {
    return super.run({ ...actor, scopeId: GLOBEX }, scope, work);
  }
}

describe.skipIf(HOST === undefined)("workflow journal row security on Postgres", () => {
  let postgres: OwnerPostgres;
  let isolation: OwnerIsolation;
  const ran: Partial<Record<"acme" | "globex" | "platform", PublicId<"wfr">>> = {};

  beforeAll(async () => {
    postgres = await ownerPostgres();
    isolation = new OwnerIsolation(postgres);
  }, 120_000);

  afterAll(async () => {
    await postgres?.close();
  });

  /** Runs `sql` as the superuser, past row security: a seed or a check. */
  const superuser = (sql: string, params: readonly unknown[] = []) =>
    postgres.database.em().execute(sql, [...params]) as Promise<Record<string, unknown>[]>;

  /** The ids `sql` reads as the service role in `owner` (none: no owner). */
  const idsAs = async (owner: string | undefined, sql: string): Promise<unknown[]> =>
    (
      (await asService(postgres, owner, () => postgres.service().em().execute(sql))) as {
        id: unknown;
      }[]
    ).map((row) => row.id);

  /** An engine on the service role's connection, its isolation `bound` (none: no tenancy). */
  const engineOf = (bound: CallIsolation | undefined) => {
    const clock = new SystemClock();
    const runner = new NativeWorkflowRunnerDriver(
      new PostgresWorkflowJournalDriver(postgres.service()),
      new Locks(new MemoryLockDriver(clock), clock),
      clock,
    );
    runner.connect(
      resolverOf([
        [ShipWorkflow, new ShipWorkflow()],
        [NoteWorkflow, new NoteWorkflow()],
        ...(bound === undefined ? [] : [[CallIsolation, bound] as const]),
      ]),
    );
    return runner;
  };

  /** Starts a run of order `orderId` in `owner`'s session; it parks on its signal. */
  const start = async (owner: PublicId<"scp"> | undefined, orderId: string) => {
    const runner = engineOf(isolation);
    await asService(postgres, owner, () =>
      runner.start(ShipWorkflow, { orderId }, originOf(owner)),
    );
    const [row] = await superuser(
      "select id from workflow.runs where input ->> 'orderId' = ? and tenant_id is not distinct from ?",
      [orderId, owner ?? null],
    );
    return row?.["id"] as PublicId<"wfr">;
  };

  /** Each table's `[id, owner]` of run `id` (its steps by name). */
  const ownersOf = async (id: string) => ({
    run: await superuser("select status, tenant_id from workflow.runs where id = ?", [id]),
    steps: await superuser(
      "select name, tenant_id from workflow.steps where run_id = ? order by position",
      [id],
    ),
  });

  it("owns a run started in an owner's session by that owner, its steps too", async () => {
    ran.acme = await start(ACME, "o1");
    ran.globex = await start(GLOBEX, "o1");
    ran.platform = await start(undefined, "o1");
    expect(await ownersOf(ran.acme)).toEqual({
      run: [{ status: "waiting", tenant_id: ACME }],
      steps: [{ name: "ship", tenant_id: ACME }],
    });
    expect((await ownersOf(ran.globex)).run).toEqual([{ status: "waiting", tenant_id: GLOBEX }]);
    expect(await ownersOf(ran.platform)).toEqual({
      run: [{ status: "waiting", tenant_id: null }],
      steps: [{ name: "ship", tenant_id: null }],
    });
  });

  it("shows a session with no owner only the platform's rows, an owner its own and the platform's", async () => {
    expect(await idsAs(undefined, "select id from workflow.runs")).toEqual([ran.platform]);
    expect((await idsAs(ACME, "select id from workflow.runs")).sort()).toEqual(
      [ran.acme, ran.platform].sort(),
    );
    expect((await idsAs(GLOBEX, "select run_id as id from workflow.steps")).sort()).toEqual(
      [ran.globex, ran.platform].sort(),
    );
  });

  it("claims only the run whose own owner holds its signal, across owners", async () => {
    const runner = engineOf(isolation);
    await asService(postgres, ACME, () =>
      runner.hold(Shipped, { by: "usr_acme" }, { orderId: "o1" }),
    );
    expect(await superuser("select tenant_id from workflow.signals")).toEqual([
      { tenant_id: ACME },
    ]);
    const journal = new PostgresWorkflowJournalDriver(postgres.service());
    const claims = await asService(postgres, undefined, () => journal.due(new Date(), 10));
    expect(claims.map((claim) => [claim.id, claim.ownerId])).toEqual([[ran.acme, ACME]]);
    // a wait that passed is due in every owner, claimed with each owner
    const later = await asService(postgres, undefined, () =>
      journal.due(new Date(Date.now() + 45 * MINUTE), 10),
    );
    expect(later.map((claim) => claim.ownerId ?? null).sort()).toEqual([ACME, GLOBEX, null].sort());
  });

  it("refuses an owned run when no isolation is bound, and leaves it waiting", async () => {
    await expect(engineOf(undefined).tick()).rejects.toBeInstanceOf(RowIsolationMissingError);
    expect((await ownersOf(ran.acme ?? "")).run).toEqual([{ status: "waiting", tenant_id: ACME }]);
  });

  it("fails the tick when a claimed run does not load in its owner, never skipping it", async () => {
    await expect(engineOf(new WrongOwnerIsolation(postgres)).tick()).rejects.toBeInstanceOf(
      ClaimNotLoadedError,
    );
    expect((await ownersOf(ran.acme ?? "")).run).toEqual([{ status: "waiting", tenant_id: ACME }]);
  });

  it("resumes the run on its owner's signal and saves every step and the run in that owner", async () => {
    expect(await engineOf(isolation).tick()).toBe(1);
    expect(await ownersOf(ran.acme ?? "")).toEqual({
      run: [{ status: "completed", tenant_id: ACME }],
      steps: [
        { name: "ship", tenant_id: ACME },
        { name: "close", tenant_id: ACME },
      ],
    });
    expect(await superuser("select id from workflow.signals")).toEqual([]);
    expect((await ownersOf(ran.globex ?? "")).run).toEqual([
      { status: "waiting", tenant_id: GLOBEX },
    ]);
  });

  it("resumes the other owner's run and the platform run, each in its own", async () => {
    const runner = engineOf(isolation);
    await asService(postgres, GLOBEX, () =>
      runner.hold(Shipped, { by: "usr_globex" }, { orderId: "o1" }),
    );
    await asService(postgres, undefined, () =>
      runner.hold(Shipped, { by: "sys" }, { orderId: "o1" }),
    );
    expect(await runner.tick()).toBe(2);
    expect(await ownersOf(ran.globex ?? "")).toEqual({
      run: [{ status: "completed", tenant_id: GLOBEX }],
      steps: [
        { name: "ship", tenant_id: GLOBEX },
        { name: "close", tenant_id: GLOBEX },
      ],
    });
    expect(await ownersOf(ran.platform ?? "")).toEqual({
      run: [{ status: "completed", tenant_id: null }],
      steps: [
        { name: "ship", tenant_id: null },
        { name: "close", tenant_id: null },
      ],
    });
  });

  it("removes every owner's lapsed signals in its owner, keeping a live one, with no DELETE for the system role", async () => {
    const lapsed = new Date(Date.now() - MINUTE);
    const live = new Date(Date.now() + 60 * MINUTE);
    for (const [id, owner, expiresAt] of [
      ["wfs_acme", ACME, lapsed],
      ["wfs_globex", GLOBEX, lapsed],
      ["wfs_platform", null, lapsed],
      ["wfs_live", ACME, live],
    ] as const)
      await superuser(
        `insert into workflow.signals (id, signal, correlation, payload, received_at, expires_at, tenant_id)
           values (?, 'Gone', '', '{}'::jsonb, ?, ?, ?)`,
        [id, lapsed, expiresAt, owner],
      );
    // a session with no owner cannot remove an owner's row: the expiry must run in each owner
    await asService(postgres, undefined, () =>
      postgres.service().em().execute("delete from workflow.signals where id = 'wfs_acme'"),
    );
    expect(await superuser("select count(*)::int as n from workflow.signals")).toEqual([{ n: 4 }]);
    await engineOf(isolation).tick();
    expect(await superuser("select id, tenant_id from workflow.signals")).toEqual([
      { id: "wfs_live", tenant_id: ACME },
    ]);
    expect(
      await superuser(
        "select has_table_privilege('stackra_system_access', 'workflow.signals', 'DELETE') as can",
      ),
    ).toEqual([{ can: false }]);
  });

  it("answers run_not_found to another owner's session, as to a caller the query refuses", async () => {
    const query = new GetRunQuery(engineOf(isolation));
    const service = { kind: ActorKind.Service, id: "svc_shipping" } as unknown as Actor;
    const ctx = { actor: service, scope: undefined } as unknown as QueryContext;
    await expect(
      asService(postgres, ACME, () => query.handle({ runId: ran.acme } as never, ctx)),
    ).resolves.toMatchObject({ runId: ran.acme, status: "completed" });
    await expect(
      asService(postgres, GLOBEX, () => query.handle({ runId: ran.acme } as never, ctx)),
    ).rejects.toBeInstanceOf(RunNotFoundError);
  });
  it("runs a system origin that names no tenant, started in an owner, in that owner to completion", async () => {
    const runner = engineOf(isolation);
    const units = isolation.actors.length;
    // as the explorer starts a run for an event with no actor: the system actor, no scope, in the delivery's owner
    await asService(postgres, ACME, () =>
      runner.start(NoteWorkflow, { text: "hello" }, originOf(undefined)),
    );
    const [row] = await superuser(
      "select id, status, tenant_id, origin -> 'actor' ->> 'scopeId' as actor_owner from workflow.runs where workflow = 'NoteWorkflow'",
    );
    expect(row).toMatchObject({ status: "completed", tenant_id: ACME, actor_owner: ACME });
    expect(await ownersOf(String(row?.["id"]))).toMatchObject({
      steps: [
        { name: "write", tenant_id: ACME },
        { name: "seal", tenant_id: ACME },
      ],
    });
    const steps = isolation.actors.slice(units).filter((actor) => actor.id === "sys_test");
    expect(steps.length).toBe(2);
    for (const actor of steps) expect(actor.scopeId).toBe(ACME);
  });
});
