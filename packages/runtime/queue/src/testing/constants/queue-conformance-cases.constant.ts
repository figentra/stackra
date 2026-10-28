/**
 * Stackra file contract:
 * Purpose: `QUEUE_CONFORMANCE_CASES`, the rules of the `QueueDriver` port as runnable cases: a unique key held while a
 *          job waits, a retry that waits for its time, priority first, the least busy scope next, a scope's running
 *          cap, a throttle release that gives the attempt back, a dead letter and its redrive, and batch counts.
 * Boundary: test code only, in the `./testing` entry, vendor-neutral and free of any test framework. Each case gets a
 *           fresh, empty driver and fixed instants, so no clock runs. Cases that reserve need a polled store (memory,
 *           Postgres); a broker-delivered driver skips them by id.
 * Runtime: isomorphic
 * Governing contract: ADR 0148 (decisions 1, 2 and 3); ADR 0142.
 */
import { Duration } from "@stackra/contracts";
import type { PublicId } from "@stackra/contracts";

import { JobStatus } from "#contracts/index";
import type { QueuedJob } from "#contracts/index";
import type { QueueConformanceCase } from "#testing/types/queue-conformance-case.type";

/** Noon on 2026-10-24 plus `seconds`. */
const at = (seconds: number): Date => new Date(Date.UTC(2026, 9, 24, 12, 0, seconds));

/** A waiting job of queue `conformance`, due at noon, with `fields` on top. */
function jobOf(id: PublicId<"job">, fields: Partial<QueuedJob> = {}): QueuedJob {
  return {
    id,
    queue: "conformance",
    key: "conformance.job.run@1",
    input: { n: 1 },
    status: JobStatus.Waiting,
    attempts: 0,
    runAt: at(0),
    lease: Duration.seconds(60),
    ...fields,
  };
}

/** The mismatch of `got` against `want`; empty when equal. */
function same(label: string, got: unknown, want: unknown): string[] {
  return JSON.stringify(got) === JSON.stringify(want)
    ? []
    : [`${label}: expected ${JSON.stringify(want)}, got ${JSON.stringify(got)}`];
}

/** A scope node. */
const scope = (id: PublicId<"scp">) => ({ id, path: `platform.${id}` });

const failure = { code: "conformance", message: "conformance" };

/** Every case, in run order. */
export const QUEUE_CONFORMANCE_CASES: readonly QueueConformanceCase[] = [
  {
    id: "queue.unique",
    run: async (driver) => [
      ...same("first push", await driver.push(jobOf("job_a", { uniqueKey: "u" })), true),
      ...same("second push", await driver.push(jobOf("job_b", { uniqueKey: "u" })), false),
    ],
  },
  {
    id: "queue.retry-waits",
    run: async (driver) => {
      await driver.push(jobOf("job_a"));
      const first = await driver.reserve("conformance", at(1));
      await driver.retry("job_a", at(30), failure);
      const early = await driver.reserve("conformance", at(10));
      const late = await driver.reserve("conformance", at(30));
      return [
        ...same("first attempt", first?.attempts, 1),
        ...same("before its time", early?.id, undefined),
        ...same("at its time", [late?.id, late?.attempts, late?.lastError], ["job_a", 2, failure]),
      ];
    },
  },
  {
    id: "queue.priority",
    run: async (driver) => {
      await driver.push(jobOf("job_low", { runAt: at(0) }));
      await driver.push(jobOf("job_high", { runAt: at(5), priority: 10 }));
      return same(
        "highest priority first",
        (await driver.reserve(undefined, at(10)))?.id,
        "job_high",
      );
    },
  },
  {
    id: "queue.fair-scopes",
    run: async (driver) => {
      const busy = scope("scp_busy");
      await driver.push(jobOf("job_b1", { scope: busy, runAt: at(0) }));
      await driver.push(jobOf("job_b2", { scope: busy, runAt: at(1) }));
      await driver.push(jobOf("job_q1", { scope: scope("scp_quiet"), runAt: at(2) }));
      const first = await driver.reserve(undefined, at(10));
      const second = await driver.reserve(undefined, at(10));
      return [
        ...same("oldest first while no scope runs", first?.id, "job_b1"),
        ...same("then the scope with fewer running jobs", second?.id, "job_q1"),
      ];
    },
  },
  {
    id: "queue.scope-cap",
    run: async (driver) => {
      const capped = scope("scp_capped");
      await driver.push(jobOf("job_c1", { scope: capped, scopeConcurrency: 1, runAt: at(0) }));
      await driver.push(jobOf("job_c2", { scope: capped, scopeConcurrency: 1, runAt: at(1) }));
      const first = await driver.reserve(undefined, at(10));
      const blocked = await driver.reserve(undefined, at(10));
      await driver.remove("job_c1");
      const freed = await driver.reserve(undefined, at(10));
      return [
        ...same("first of the scope", first?.id, "job_c1"),
        ...same("none past the cap", blocked?.id, undefined),
        ...same("the next once one ends", freed?.id, "job_c2"),
      ];
    },
  },
  {
    id: "queue.release",
    run: async (driver) => {
      await driver.push(jobOf("job_a"));
      await driver.reserve(undefined, at(1));
      await driver.release("job_a", at(20));
      const early = await driver.reserve(undefined, at(10));
      const later = await driver.reserve(undefined, at(20));
      return [
        ...same("waits until released time", early?.id, undefined),
        ...same("the attempt was given back", later?.attempts, 1),
      ];
    },
  },
  {
    id: "queue.dead-letter",
    run: async (driver) => {
      await driver.push(jobOf("job_a"));
      await driver.reserve(undefined, at(1));
      await driver.deadLetter("job_a", failure);
      const dead = await driver.deadLetters("conformance", 10);
      const redriven = await driver.redrive("job_a", at(5));
      const again = await driver.reserve(undefined, at(5));
      return [
        ...same(
          "dead letters",
          dead.map((job) => [job.id, job.status]),
          [["job_a", "dead"]],
        ),
        ...same("redrive", redriven, true),
        ...same("redriven attempt", again?.attempts, 1),
      ];
    },
  },
  {
    id: "queue.batch",
    run: async (driver) => {
      await driver.openBatch({ id: "jbt_conformance", total: 3, done: 0, failed: 0 });
      await driver.settleBatch("jbt_conformance", false);
      const settled = await driver.settleBatch("jbt_conformance", true);
      return [
        ...same("settled", settled, { id: "jbt_conformance", total: 3, done: 1, failed: 1 }),
        ...same("read", await driver.batch("jbt_conformance"), settled),
        ...same("unknown", await driver.batch("jbt_missing"), undefined),
      ];
    },
  },
];
