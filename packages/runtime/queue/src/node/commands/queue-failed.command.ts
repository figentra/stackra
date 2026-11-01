/**
 * Stackra file contract:
 * Purpose: `QueueFailedCommand`, `queue:failed`: a table of the dead-lettered jobs, oldest first.
 * Boundary: read only, through `QueueDriver.deadLetters`. `--queue` narrows it to one queue and `--limit` caps the
 *           rows (50 by default).
 * Runtime: node
 * Governing contract: STA-1731 spec FR-012; ADR 0506; ADR 0148.
 */
import { Command, Option } from "@stackra/console";
import type { CommandIo } from "@stackra/console";
import { Int, Str } from "@stackra/validation";

import type { QueueDriver } from "#contracts/ports/queue-driver.port";

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

  /**
   * @param driver - the queue port.
   */
  constructor(driver: QueueDriver) {
    super();
    this.driver = driver;
  }

  /** Prints the table; returns the jobs. */
  async handle(io: CommandIo): Promise<Readonly<Record<string, unknown>>> {
    const jobs = await this.driver.deadLetters(this.queue, this.limit);
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
