/**
 * Stackra file contract:
 * Purpose: `QueueRetryCommand`, `queue:retry <id>` and `queue:retry --all`: makes a failed job (or every failed job)
 *          wait again with its attempts reset, through `QueueDriver.redrive`.
 * Boundary: one id needs no confirmation. `--all` is bulk, so an interactive run confirms and any other run needs
 *           `--force`, else it exits 2 naming the flag. A job that is not dead, or whose unique key a live job holds,
 *           is refused (one id: exit 2; `--all`: counted as skipped).
 * Runtime: node
 * Governing contract: STA-1731 spec FR-012 and FR-013; ADR 0506; ADR 0148.
 */
import { Argument, Command, Option, UsageError } from "@stackra/console";
import type { CommandIo } from "@stackra/console";
import type { Clock, PublicId } from "@stackra/contracts";
import { Str } from "@stackra/validation";

import type { QueueDriver } from "#contracts/ports/queue-driver.port";

/** The most failed jobs one `--all` run takes. */
const ALL_LIMIT = 10_000;

/** Retries failed jobs. */
export class QueueRetryCommand extends Command({
  name: "queue:retry",
  description: "Retry a failed job, or all of them",
}) {
  /** The job to retry. */
  @Argument({
    description: "The failed job's id",
    optional: true,
  })
  @Str({ pattern: /^job_\w+$/ })
  id?: string;

  /** Retry every failed job. */
  @Option({ description: "Retry every failed job" })
  all = false;

  /** Skip the confirmation of `--all`. */
  @Option({ description: "Retry all without asking" })
  force = false;

  /** The job store. */
  private readonly driver: QueueDriver;

  /** The time source. */
  private readonly clock: Clock;

  /**
   * @param driver - the queue port.
   * @param clock - the time the jobs are due from.
   */
  constructor(driver: QueueDriver, clock: Clock) {
    super();
    this.driver = driver;
    this.clock = clock;
  }

  /** Retries; returns the ids it queued again and the ones it skipped. */
  async handle(io: CommandIo): Promise<Readonly<Record<string, unknown>>> {
    if (this.id === undefined && !this.all)
      throw new UsageError("Name a failed job to retry", "Pass its id, or --all");
    if (this.id !== undefined && this.all) throw new UsageError("Give a job id or --all, not both");
    if (this.all && !this.force) {
      if (!io.interactive)
        throw new UsageError("queue:retry --all queues every failed job again", "Pass --force");
      const sure = await io.prompt.confirm({ message: "Retry every failed job?", default: false });
      if (!sure) {
        io.output.warn("Cancelled; nothing was retried");
        return { retried: [], skipped: [] };
      }
    }
    const ids =
      this.id === undefined
        ? (await this.driver.deadLetters(undefined, ALL_LIMIT)).map((job) => job.id)
        : [this.id as PublicId<"job">];
    const retried: string[] = [];
    const skipped: string[] = [];
    for (const id of ids) {
      const done = await this.driver.redrive(id, this.clock.now());
      (done ? retried : skipped).push(id);
    }
    if (this.id !== undefined && skipped.length > 0)
      throw new UsageError(`${this.id} is not a failed job, or an identical job is already queued`);
    io.output.success(`Queued ${retried.length} job(s) again`);
    if (skipped.length > 0) io.output.warn(`Skipped ${skipped.length} job(s)`);
    return { retried, skipped };
  }
}
