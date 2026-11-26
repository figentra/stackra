/**
 * Stackra file contract:
 * Purpose: the soak of the outbox relay on Postgres (ADR 0182 decision 4, STA-317): k6 posts to a load target whose
 *          one scenario writes an event message in one of two tenants with the writer's own statement
 *          (`insertMessages`, in the tenant's transaction, as a committing call does), while two relays
 *          (`OutboxRelayService.work`, two loops of one service) share one lock, so one ticks at a time (ADR 0149). After
 *          the load it waits for the outbox to drain and checks that every message was published exactly once, none was
 *          retried or dead-lettered and `outbox.messages` is empty, and that the relay's lag (written to published)
 *          stays under ADR 0221's five seconds at p95; it keeps the numbers (`writeLoadReport("outbox.relay")`). A
 *          second test writes a backlog first (`STACKRA_LOAD_BACKLOG` messages, 3000 by default) and times one relay
 *          draining it: the ceiling of the one lock-holding relay a service runs (`writeLoadReport("outbox.ceiling")`).
 * Boundary: load tier (`.load`): runs only where k6 is installed and `TESTBED_POSTGRES_HOST` names a Postgres, skipped
 *           elsewhere. One fresh database (`ownerPostgres`) with the service's default pool of ten connections
 *           (ADR 0473), owned rows written and loaded as the NOBYPASSRLS service role (`asService`, `OwnerIsolation`).
 *           The lock is the in-process one shared by both relays: it shows that a second relay adds no throughput
 *           and no duplicate; across instances the Postgres lock driver does the same (@stackra/locking's tests). The
 *           publisher records in memory, so the numbers are the relay's and Postgres's, not a transport's.
 *           `STACKRA_LOAD_RATE` and `STACKRA_LOAD_DURATION` stretch it into a soak.
 * Runtime: node (vitest)
 * Governing contract: ADR 0182 (decisions 1 and 4: the load tier, weekly k6 load tests); ADR 0078 (decision 4: the
 *                     relay); ADR 0221 (decision 5: under five seconds of lag); ADR 0149 (one runner under a lock);
 *                     ADR 0473 (the pool budget per service); ADR 0239 (2026-11-07 amendment); ADR 0022.
 */
import type { Resolver } from "@stackra/actions";
import { CallIsolation } from "@stackra/actions/contracts";
import { buildConfig } from "@stackra/config";
import { type AnyClass, Driver } from "@stackra/container";
import { Clock } from "@stackra/contracts";
import type { PublicId } from "@stackra/contracts";
import { Locks, MemoryLockDriver } from "@stackra/locking";
import { afterAll, beforeAll, describe, expect, it } from "@stackra/testing";
import {
  k6Binary,
  runK6,
  serveLoadTarget,
  soakLoad,
  summariseLatencies,
  writeLoadReport,
} from "@stackra/testing/node";

import { OutboxConfig } from "#config/outbox.config";
import { EventPublisher, MessageKind } from "#contracts/index";
import type { EventEnvelope, OutboxMessage } from "#contracts/index";
import {
  asService,
  HOST,
  OwnerIsolation,
  ownerPostgres,
} from "#node/__tests__/fixtures/owner-postgres.fixture";
import type { OwnerPostgres } from "#node/__tests__/fixtures/owner-postgres.fixture";
import { PostgresChangeFeedDriver } from "#node/drivers/postgres-change-feed.driver";
import { PostgresOutboxDriver } from "#node/drivers/postgres-outbox.driver";
import { insertMessages } from "#node/functions/insert-messages.function";
import { OutboxRelayService } from "#node/services/outbox-relay.service";

/** Two owners (tenant nodes) the messages alternate between. */
const OWNERS = ["scp_01jab3k4m5n6p7q8r9s0t1v2w3", "scp_01jab3k4m5n6p7q8r9s0t1v2w4"] as const;

/** How long the outbox may take to drain once the load stops, and ADR 0221's lag. */
const CEILING = { drainMs: 60_000, lagP95Ms: 5000 } as const;

class SystemClock extends Clock {
  now(): Date {
    return new Date();
  }
}

/** Counts each message it is handed and how long after it was written. */
class CountingPublisher extends Driver(EventPublisher) {
  readonly published = new Map<string, number>();

  readonly lags: number[] = [];

  async publish(envelope: EventEnvelope): Promise<void> {
    this.published.set(envelope.id, (this.published.get(envelope.id) ?? 0) + 1);
    this.lags.push(Date.now() - Date.parse(envelope.occurredAt));
  }
}

/** Resolves once `done` holds, polling every 100 ms, or after `ms` regardless. */
async function until(done: () => boolean, ms: number): Promise<void> {
  const deadline = Date.now() + ms;
  while (!done() && Date.now() < deadline)
    await new Promise((resolve) => {
      setTimeout(resolve, 100);
    });
}

describe.skipIf(HOST === undefined || k6Binary() === undefined)(
  "the outbox relay under a soak",
  () => {
    let postgres: OwnerPostgres;

    beforeAll(async () => {
      postgres = await ownerPostgres();
    }, 120_000);

    afterAll(async () => {
      await postgres?.close();
    });

    /** A publisher, `relays` relays sharing one lock, a writer and how to run the relays. */
    const rig = (relays: number) => {
      const publisher = new CountingPublisher();
      const clock = new SystemClock();
      const locks = new Locks(new MemoryLockDriver(clock), clock);
      const bound = new Map<AnyClass, object>([[CallIsolation, new OwnerIsolation(postgres)]]);
      const resolver: Resolver = {
        has: (type) => bound.has(type),
        get: <T extends object>(type: AnyClass<T>) => bound.get(type) as T,
      };
      const services = Array.from({ length: relays }, () => {
        const relay = new OutboxRelayService(
          new PostgresOutboxDriver(postgres.database),
          new PostgresChangeFeedDriver(postgres.database),
          publisher,
          locks,
          postgres.database,
          clock,
          buildConfig(OutboxConfig, { values: { batchWindowSeconds: 0 } }),
        );
        relay.connect(resolver);
        return relay;
      });
      /** Writes event message `seq` in its owner's transaction, as the writer does at a call's commit. */
      const write = (seq: number) => {
        const now = new Date();
        const message: OutboxMessage = {
          id: `evt_soak${String(seq).padStart(8, "0")}` as PublicId<"evt">,
          kind: MessageKind.Event,
          type: "soak.message.written.v1",
          data: { seq },
          meta: {},
          occurredAt: now,
          attempts: 0,
          availableAt: now,
        };
        return asService(postgres, OWNERS[seq % OWNERS.length], () =>
          insertMessages(postgres.database.em(), [message]),
        );
      };
      /** Starts every relay's loop; the returned function stops them and resolves once they have. */
      const start = () => {
        const stop = new AbortController();
        const working = Promise.all(services.map((relay) => relay.work({ signal: stop.signal })));
        return async () => {
          stop.abort();
          await working;
        };
      };
      return { publisher, write, start };
    };

    /** The messages left in the outbox, past row security. */
    const left = async (): Promise<number> => {
      const [row] = (await postgres.database
        .em()
        .execute("select count(*)::int as n from outbox.messages")) as { n: number }[];
      return row?.n ?? -1;
    };

    it("publishes every message exactly once, inside ADR 0221's lag, with two relays on one lock", async () => {
      const { publisher, write, start } = rig(2);
      const stop = start();
      let written = 0;
      const target = await serveLoadTarget({
        write: async () => {
          const seq = written;
          written += 1;
          await write(seq);
        },
      });
      try {
        // About two thirds of the drain rate one relay reached on box 2 (155 to 177 a second, runbooks/capacity): the soak
        // holds the relay to its lag below its ceiling; the backlog test below measures the ceiling itself.
        const load = soakLoad({ rate: 100, duration: "30s" });
        const k6 = await runK6({
          target: target.url,
          scenario: "write",
          load,
          thresholds: {
            http_req_failed: ["rate<0.001"],
            http_req_duration: ["p(95)<500"],
            dropped_iterations: ["count<1"],
          },
        });
        const writes = target.latency("write");
        const loadEnded = Date.now();
        await until(() => publisher.published.size >= writes.served, CEILING.drainMs);
        const drainMs = Date.now() - loadEnded;
        await stop();
        const lag = summariseLatencies(publisher.lags, { count: 0 });
        writeLoadReport("outbox.relay", {
          subject:
            "event messages written in two tenants, two OutboxRelayService loops on one lock, Postgres, pool of 10",
          load,
          k6,
          write: writes,
          lag,
          messages: writes.served,
          drainMs,
          relays: 2,
        });

        expect(k6.crossed).toEqual([]);
        expect(writes.failed).toBe(0);
        expect(writes.served).toBe(k6.requests);
        // every message published exactly once, and none left: no retry, no dead letter, no double claim
        expect(publisher.published.size).toBe(writes.served);
        expect([...publisher.published.values()].every((count) => count === 1)).toBe(true);
        expect(await left()).toBe(0);
        expect(drainMs).toBeLessThan(CEILING.drainMs);
        expect(lag.p95).toBeLessThan(CEILING.lagP95Ms);
      } finally {
        await stop();
        await target.close();
      }
    });

    it("drains a written backlog at the ceiling of one relay", async () => {
      const { publisher, write, start } = rig(1);
      const backlog = Number(process.env["STACKRA_LOAD_BACKLOG"] ?? 3000);
      expect(Number.isInteger(backlog) && backlog > 0).toBe(true);
      // write the backlog first, eight transactions at a time, so the relay starts on a full outbox
      const writtenFrom = Date.now();
      let seq = 1_000_000;
      const end = seq + backlog;
      await Promise.all(
        Array.from({ length: 8 }, async () => {
          while (seq < end) {
            const mine = seq;
            seq += 1;
            await write(mine);
          }
        }),
      );
      const writeMs = Date.now() - writtenFrom;
      const drainFrom = Date.now();
      const stop = start();
      // Five minutes, or longer for a backlog that needs it at twenty a second, the floor this test holds to.
      await until(
        () => publisher.published.size >= backlog,
        Math.max(CEILING.drainMs * 5, backlog * 50),
      );
      const drainMs = Date.now() - drainFrom;
      await stop();
      writeLoadReport("outbox.ceiling", {
        subject: `a backlog of ${backlog} event messages in two tenants drained by one OutboxRelayService, Postgres, pool of 10`,
        backlog,
        writePerSecond: Math.round(backlog / (writeMs / 1000)),
        drainPerSecond: Math.round(backlog / (drainMs / 1000)),
        drainMs,
        relays: 1,
      });

      expect(publisher.published.size).toBe(backlog);
      expect([...publisher.published.values()].every((count) => count === 1)).toBe(true);
      expect(await left()).toBe(0);
    });
  },
);
