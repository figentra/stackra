/**
 * Stackra file contract:
 * Purpose: the memory driver passes the `QueueDriver` conformance suite, a skipped case is not run, and a driver that
 *          breaks a rule is reported by case id instead of crashing the run.
 * Boundary: test only; the memory driver and a subclass of it that ignores priority.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0148 (decisions 1, 2 and 3); ADR 0142.
 */
import { describe, expect, it } from "@stackra/testing";

import type { QueuedJob } from "#contracts/index";
import { MemoryQueueDriver } from "#core/drivers/memory-queue.driver";
import { QUEUE_CONFORMANCE_CASES } from "#testing/constants/queue-conformance-cases.constant";
import { runQueueConformance } from "#testing/functions/run-queue-conformance.function";

/** A memory driver that drops every job's priority. */
class FlatPriorityDriver extends MemoryQueueDriver {
  override push(job: QueuedJob): Promise<boolean> {
    const { priority: _dropped, ...flat } = job;
    return super.push(flat);
  }
}

describe(runQueueConformance, () => {
  it("passes the memory driver on every case", async () => {
    const results = await runQueueConformance(() => new MemoryQueueDriver());
    expect(results.map((result) => result.caseId)).toEqual(
      QUEUE_CONFORMANCE_CASES.map((conformance) => conformance.id),
    );
    expect(results.flatMap((result) => result.mismatches)).toEqual([]);
  });

  it("skips the cases it is told to", async () => {
    const results = await runQueueConformance(() => new MemoryQueueDriver(), {
      skip: ["queue.priority"],
    });
    expect(results.map((result) => result.caseId)).not.toContain("queue.priority");
  });

  it("reports a broken rule by its case", async () => {
    const results = await runQueueConformance(() => new FlatPriorityDriver());
    const priority = results.find((result) => result.caseId === "queue.priority");
    expect(priority?.mismatches).toHaveLength(1);
  });
});
