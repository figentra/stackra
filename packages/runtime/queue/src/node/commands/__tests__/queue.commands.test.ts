/**
 * Stackra file contract:
 * Purpose: proves `queue:work` runs until a signal stops it, `queue:failed` lists the dead letters, and `queue:retry`
 *          queues one failed job or (with `--force` or a yes) all of them again, refusing `--all` without either.
 * Boundary: test only; runs through `runCommandForTest` over a `MemoryQueueDriver` and a real `QueueWorkerService`.
 * Runtime: node (vitest)
 * Governing contract: STA-1731 spec FR-012 and FR-013; ADR 0022 (test placement).
 */
// @covers sta-1731:FR-012 sta-1731:FR-013
import { runCommandForTest } from "@stackra/console/testing";
import { Clock, Duration } from "@stackra/contracts";
import type { PublicId } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { JobStatus } from "#contracts/enums/job-status.enum";
import { QueueDriver } from "#contracts/ports/queue-driver.port";
import type { QueuedJob } from "#contracts/types/queued-job.type";
import { MemoryQueueDriver } from "#core/drivers/memory-queue.driver";
import { QueueFailedCommand } from "#node/commands/queue-failed.command";
import { QueueRetryCommand } from "#node/commands/queue-retry.command";
import { QueueWorkCommand } from "#node/commands/queue-work.command";
import { QueueWorkerService } from "#node/services/queue-worker.service";

class FixedClock extends Clock {
  now(): Date {
    return new Date("2026-10-24T12:00:00.000Z");
  }
}

const NOW = new Date("2026-10-24T12:00:00.000Z");

/** A dead job of `queue` with `id`. */
function deadJob(id: PublicId<"job">, queue = "default"): QueuedJob {
  return {
    id,
    queue,
    key: "messages.message.deliver@1",
    input: null,
    status: JobStatus.Waiting,
    attempts: 3,
    runAt: NOW,
    lease: Duration.seconds(60),
  };
}

/** A memory store holding `ids` as failed jobs, and the container serving it to a command. */
async function setup(...ids: PublicId<"job">[]) {
  const driver = new MemoryQueueDriver();
  for (const id of ids) {
    await driver.push(deadJob(id));
    await driver.deadLetter(id, { code: "provider_unavailable", message: "down" });
  }
  const worker = new QueueWorkerService(driver, new FixedClock());
  worker.connect({ has: () => false, get: () => ({}) as never });
  const services = new Map<unknown, unknown>([
    [QueueDriver, driver],
    [Clock, new FixedClock()],
    [QueueWorkerService, worker],
  ]);
  const container = () => ({
    get: <T extends object>(type: abstract new (...args: never[]) => T): T => {
      const args: unknown[] = [];
      if (type === (QueueFailedCommand as unknown)) args.push(driver);
      if (type === (QueueRetryCommand as unknown)) args.push(driver, services.get(Clock));
      if (type === (QueueWorkCommand as unknown)) args.push(worker);
      return Reflect.construct(type, args) as T;
    },
    close: async () => {},
  });
  return { driver, container };
}

describe(QueueWorkCommand, () => {
  it("works until SIGINT, then exits 130", async () => {
    const { container } = await setup();
    const result = await runCommandForTest([QueueWorkCommand], ["queue:work"], {
      container,
      signal: "SIGINT",
    });
    expect(result.exitCode).toBe(130);
    expect(result.stdout + result.stderr).toContain("default");
  });

  it("refuses a concurrency below 1", async () => {
    const { container } = await setup();
    const result = await runCommandForTest(
      [QueueWorkCommand],
      ["queue:work", "--concurrency", "0"],
      {
        container,
      },
    );
    expect(result.exitCode).toBe(2);
  });
});

describe(QueueFailedCommand, () => {
  it("lists the failed jobs", async () => {
    const { container } = await setup("job_a", "job_b");
    const result = await runCommandForTest([QueueFailedCommand], ["queue:failed"], { container });
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("job_a");
    expect(result.stdout).toContain("provider_unavailable");
  });

  it("says so when there are none", async () => {
    const { container } = await setup();
    const result = await runCommandForTest([QueueFailedCommand], ["queue:failed"], { container });
    expect(result.stdout).toContain("No failed jobs");
  });
});

describe(QueueRetryCommand, () => {
  it("retries one failed job without asking", async () => {
    const { driver, container } = await setup("job_a", "job_b");
    const result = await runCommandForTest([QueueRetryCommand], ["queue:retry", "job_a"], {
      container,
    });
    expect(result.exitCode).toBe(0);
    expect((await driver.deadLetters(undefined, 10)).map((job) => job.id)).toEqual(["job_b"]);
  });

  it("exits 2 for a job that is not failed", async () => {
    const { container } = await setup("job_a");
    const result = await runCommandForTest([QueueRetryCommand], ["queue:retry", "job_zzz"], {
      container,
    });
    expect(result.exitCode).toBe(2);
  });

  it("retries all with --force", async () => {
    const { driver, container } = await setup("job_a", "job_b");
    const result = await runCommandForTest(
      [QueueRetryCommand],
      ["queue:retry", "--all", "--force"],
      {
        container,
      },
    );
    expect(result.exitCode).toBe(0);
    expect(await driver.deadLetters(undefined, 10)).toEqual([]);
  });

  it("refuses --all without --force when it cannot ask, naming --force", async () => {
    const { driver, container } = await setup("job_a");
    const result = await runCommandForTest([QueueRetryCommand], ["queue:retry", "--all"], {
      container,
    });
    expect(result.exitCode).toBe(2);
    expect(result.stderr).toContain("--force");
    expect(await driver.deadLetters(undefined, 10)).toHaveLength(1);
  });

  it("retries all after a yes and keeps them after a no", async () => {
    const yes = await setup("job_a");
    const retried = await runCommandForTest([QueueRetryCommand], ["queue:retry", "--all"], {
      container: yes.container,
      answers: [true],
    });
    expect(retried.exitCode).toBe(0);
    expect(await yes.driver.deadLetters(undefined, 10)).toEqual([]);

    const no = await setup("job_a");
    const kept = await runCommandForTest([QueueRetryCommand], ["queue:retry", "--all"], {
      container: no.container,
      answers: [false],
    });
    expect(kept.exitCode).toBe(0);
    expect(await no.driver.deadLetters(undefined, 10)).toHaveLength(1);
  });
});
