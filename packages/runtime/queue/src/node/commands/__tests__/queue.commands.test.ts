/**
 * Stackra file contract:
 * Purpose: proves `queue:work` runs until a signal stops it, `queue:failed` lists the dead letters, and `queue:retry`
 *          queues one failed job or (with `--force` or a yes) all of them again, refusing `--all` without either; across
 *          owners both claim the dead letters and load or redrive each in its owner, and fail (never skip) on an owned
 *          one with no isolation bound or a claim that does not load.
 * Boundary: test only; runs through `runCommandForTest` over a `MemoryQueueDriver` (its claims given an owner where a
 *           case needs one), a recording isolation and a real `QueueWorkerService`.
 * Runtime: node (vitest)
 * Governing contract: STA-1731 spec FR-012 and FR-013; ADR 0022 (test placement); ADR 0239 (2026-11-07 amendment,
 *                     gap A).
 */
// @covers sta-1731:FR-012 sta-1731:FR-013
import { CallIsolation } from "@stackra/actions/contracts";
import { runCommandForTest } from "@stackra/console/testing";
import type { Container } from "@stackra/container";
import { Clock, Duration } from "@stackra/contracts";
import type { Actor, PublicId } from "@stackra/contracts";
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
function setup(...ids: PublicId<"job">[]) {
  return setupWith({}, ...ids);
}

/**
 * As `setup`, with every claim owned by `options.owned` and `options.isolation` bound when given.
 */
async function setupWith(
  options: { readonly owned?: string; readonly isolation?: CallIsolation },
  ...ids: PublicId<"job">[]
) {
  const driver = new MemoryQueueDriver();
  if (options.owned !== undefined) {
    const claimDead = driver.claimDead.bind(driver);
    driver.claimDead = async (filter) =>
      (await claimDead(filter)).map((claim) => ({ ...claim, ownerId: options.owned as never }));
  }
  const bound = {
    has: (token: unknown) => token === CallIsolation && options.isolation !== undefined,
    get: () => options.isolation,
  } as unknown as Container;
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
      if (type === (QueueFailedCommand as unknown)) args.push(driver, bound);
      if (type === (QueueRetryCommand as unknown)) args.push(driver, services.get(Clock), bound);
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

describe("the queue commands across owners", () => {
  it("loads and redrives each owned dead letter in its owner", async () => {
    const owners: unknown[] = [];
    const isolation = {
      run: (actor: Actor, _scope: unknown, work: () => Promise<unknown>) => {
        owners.push(actor.scopeId);
        return work();
      },
    } as unknown as CallIsolation;
    const { driver, container } = await setupWith({ owned: "scp_acme", isolation }, "job_a");
    const listed = await runCommandForTest([QueueFailedCommand], ["queue:failed"], { container });
    expect(listed.stdout).toContain("job_a");
    const retried = await runCommandForTest([QueueRetryCommand], ["queue:retry", "job_a"], {
      container,
    });
    expect(retried.exitCode).toBe(0);
    expect(owners).toEqual(["scp_acme", "scp_acme"]);
    expect(await driver.deadLetters(undefined, 10)).toEqual([]);
  });

  it("fails on an owned dead letter with no isolation bound, and keeps it", async () => {
    const { driver, container } = await setupWith({ owned: "scp_acme" }, "job_a");
    const listed = await runCommandForTest([QueueFailedCommand], ["queue:failed"], { container });
    expect(listed.exitCode).not.toBe(0);
    expect(listed.stdout).not.toContain("job_a");
    const retried = await runCommandForTest([QueueRetryCommand], ["queue:retry", "job_a"], {
      container,
    });
    expect(retried.exitCode).not.toBe(0);
    expect(await driver.deadLetters(undefined, 10)).toHaveLength(1);
  });

  it("fails on a claimed dead letter that does not load", async () => {
    const { driver, container } = await setup("job_a");
    driver.load = async () => undefined;
    const listed = await runCommandForTest([QueueFailedCommand], ["queue:failed"], { container });
    expect(listed.exitCode).not.toBe(0);
  });
});
