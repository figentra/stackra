/**
 * Stackra file contract:
 * Purpose: `QueueFailedCommand`, `queue:failed`: a table of the dead-lettered jobs, oldest first.
 * Boundary: read only. A platform operator's command over every tenant's jobs: `QueueDriver.claimDead` claims the dead
 *           letters' ids and owners through a system function, and each is loaded in its owner's isolation
 *           (`inJobOwner`, the bound `CallIsolation`, read optionally from the injected `Container`). A claimed job that
 *           does not load, or an owned one with no isolation bound, fails the command; none is skipped. `--queue`
 *           narrows it to one queue and `--limit` caps the rows (50 by default).
 * Runtime: node
 * Governing contract: STA-1731 spec FR-012; ADR 0506; ADR 0148; ADR 0239 (2026-11-07 amendment, gap A).
 */
import { Command, Option } from "@stackra/console";
import type { CommandIo } from "@stackra/console";
import { CallIsolation } from "@stackra/actions/contracts";
import type { Container } from "@stackra/container";
import { Int, Str } from "@stackra/validation";

import type { QueuedJob } from "#contracts/index";
import type { QueueDriver } from "#contracts/ports/queue-driver.port";
import { JobClaimNotLoadedError } from "#core/errors/job-claim-not-loaded.error";
import { inJobOwner } from "#core/functions/in-job-owner.function";

/** Lists the failed jobs. */
export class QueueFailedCommand extends Command({
  name: "queue:failed",
  description: "List the jobs that failed for good",
}) {
  /** Only this queue. */
  @Option({ description: "Only this queue" })
  @Str
  queue?: string;

  /** The most rows. */
  @Option({ description: "The most jobs to list" })
  @Int({ min: 1 })
  limit = 50;

  /** The job store. */
  private readonly driver: QueueDriver;

  /** The container the bound `CallIsolation`, if any, is read from at run time. */
  private readonly container: Container;

  /**
   * @param driver - the queue port.
   * @param container - the container whose `CallIsolation` each owner's dead letters load in, when one is bound.
   */
  constructor(driver: QueueDriver, container: Container) {
    super();
    this.driver = driver;
    this.container = container;
  }

  /** Prints the table; returns the jobs. */
  async handle(io: CommandIo): Promise<Readonly<Record<string, unknown>>> {
    const claims = await this.driver.claimDead({
      ...(this.queue === undefined ? {} : { queue: this.queue }),
      limit: this.limit,
    });
    const isolation = this.container.has(CallIsolation)
      ? this.container.get(CallIsolation)
      : undefined;
    const jobs: QueuedJob[] = [];
    for (const claim of claims) {
      const job = await inJobOwner(isolation, claim.ownerId, claim.id, () =>
        this.driver.load(claim.id),
      );
      if (job === undefined) throw JobClaimNotLoadedError.create({ id: claim.id });
      jobs.push(job);
    }
    if (jobs.length === 0) {
      io.output.info("No failed jobs");
    } else {
      io.output.table(
        ["Id", "Queue", "Job", "Attempts", "Error"],
        jobs.map((job) => [
          job.id,
          job.queue,
          job.key,
          job.attempts,
          job.lastError?.code ?? "unknown",
        ]),
      );
    }
    return {
      failed: jobs.map((job) => ({
        id: job.id,
        queue: job.queue,
        key: job.key,
        attempts: job.attempts,
        error: job.lastError ?? null,
      })),
    };
  }
}
