/**
 * Stackra file contract:
 * Purpose: the soak of the action pipeline (ADR 0182 decision 4, STA-317): k6 posts to a load target whose one scenario
 *          runs a write action through `ActionPipeline.execute` as a system caller with a fresh Idempotency-Key, so
 *          every call takes the claim, runs `handle` and completes the key. It checks that every call k6 made ran
 *          `handle` exactly once and none failed, holds the pipeline's own p95 and the heap's growth to a ceiling, and
 *          keeps the numbers (`writeLoadReport("actions.pipeline")`) for the capacity page.
 * Boundary: load tier (`.load`): runs only where k6 is installed (`k6Binary`), skipped elsewhere. In process, on the
 *           memory idempotency store and an allow-all access control: it measures the pipeline's own cost per call,
 *           not a database's (the queue and outbox soaks measure those). `STACKRA_LOAD_RATE` and
 *           `STACKRA_LOAD_DURATION` stretch it into a soak.
 * Runtime: node (vitest)
 * Governing contract: ADR 0182 (decisions 1 and 4: the load tier, weekly k6 load tests); ADR 0138 (the pipeline);
 *                     ADR 0136 (decision 3: Idempotency-Keys); ADR 0022 (test placement).
 */
import { randomUUID } from "node:crypto";

import { type AnyClass, Driver } from "@stackra/container";
import { type Actor, ActorKind, Clock } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";
import { k6Binary, runK6, serveLoadTarget, soakLoad, writeLoadReport } from "@stackra/testing/node";

import { AccessControl, IdempotencyStore } from "#contracts/index";
import { Action } from "#core/bases/action.base";
import { MemoryIdempotencyStoreDriver } from "#core/drivers/memory-idempotency-store.driver";
import { ActionPipeline } from "#core/services/action-pipeline.service";
import type { Resolver } from "#core/types/resolver.type";

/** The time a call reads. */
class SystemClock extends Clock {
  now(): Date {
    return new Date();
  }
}

/** Lets every call through: the soak measures the pipeline, not a policy. */
class AllowAll extends Driver(AccessControl) {
  async require(): Promise<void> {}

  async authorize(): Promise<void> {}
}

/** A write that counts each sequence number it handles. */
class StampAction extends Action({
  key: "soak.stamp",
  actors: [ActorKind.System],
}) {
  readonly handled = new Map<number, number>();

  async handle(input: { readonly seq: number }): Promise<{ readonly seq: number }> {
    this.handled.set(input.seq, (this.handled.get(input.seq) ?? 0) + 1);
    return { seq: input.seq };
  }
}

/** The system caller every call runs as. */
const SYSTEM: Actor = { kind: ActorKind.System, id: "prn_soak" };

/** The ceilings a pass holds to: the pipeline's own p95 and the heap it may add, generous for a shared runner. */
const CEILING = { p95Ms: 25, heapGrowthMb: 256 } as const;

describe.skipIf(k6Binary() === undefined)("the action pipeline under a soak", () => {
  it("runs every call once, fails none and stays inside its ceilings", async () => {
    const stamp = new StampAction();
    const clock = new SystemClock();
    const bound = new Map<AnyClass, object>([
      [Clock, clock],
      [IdempotencyStore, new MemoryIdempotencyStoreDriver(clock)],
      [AccessControl, new AllowAll()],
      [StampAction, stamp],
    ]);
    const resolver: Resolver = {
      has: (token) => bound.has(token),
      get: <T extends object>(token: AnyClass<T>): T => bound.get(token) as T,
    };
    const pipeline = new ActionPipeline(resolver);
    let next = 0;
    const target = await serveLoadTarget({
      execute: async () => {
        const seq = next;
        next += 1;
        await pipeline.execute(
          StampAction,
          { seq },
          { actor: SYSTEM, idempotencyKey: `soak-${randomUUID()}` },
        );
      },
    });
    const heapBefore = process.memoryUsage().heapUsed;
    try {
      const load = soakLoad({ rate: 200, duration: "20s" });
      const k6 = await runK6({
        target: target.url,
        scenario: "execute",
        load,
        thresholds: {
          http_req_failed: ["rate<0.001"],
          http_req_duration: ["p(95)<250"],
          dropped_iterations: ["count<1"],
        },
      });
      const server = target.latency("execute");
      const heapGrowthMb = (process.memoryUsage().heapUsed - heapBefore) / 1_048_576;
      writeLoadReport("actions.pipeline", {
        subject: "ActionPipeline.execute, a system write with an Idempotency-Key (memory stores)",
        load,
        k6,
        server,
        heapGrowthMb: Math.round(heapGrowthMb),
      });

      expect(k6.crossed).toEqual([]);
      expect(server.failed).toBe(0);
      // every request k6 sent ran handle exactly once
      expect(server.served).toBe(k6.requests);
      expect(stamp.handled.size).toBe(server.served);
      expect([...stamp.handled.values()].every((count) => count === 1)).toBe(true);
      expect(server.p95).toBeLessThan(CEILING.p95Ms);
      expect(heapGrowthMb).toBeLessThan(CEILING.heapGrowthMb);
    } finally {
      await target.close();
    }
  });
});
