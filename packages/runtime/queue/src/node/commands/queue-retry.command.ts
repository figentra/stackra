/**
 * Stackra file contract:
 * Purpose: `QueueRetryCommand`, `queue:retry <id>` and `queue:retry --all`: makes a failed job (or every failed job)
 *          wait again with its attempts reset, through `QueueDriver.redrive`.
 * Boundary: one id needs no confirmation. `--all` is bulk, so an interactive run confirms and any other run needs
 *           `--force`, else it exits 2 naming the flag. A job that is not dead, or whose unique key a live job holds,
 *           is refused (one id: exit 2; `--all`: counted as skipped). A platform operator's command over every
 *           tenant's jobs: `QueueDriver.claimDead` claims the dead letters' owners (the one id's too) through a system
 *           function, and each redrive runs in its owner's isolation (`inJobOwner`, the bound `CallIsolation`, read
 *           optionally from the injected `Container`); an owned job with no isolation bound fails the command.
 * Runtime: node
 * Governing contract: STA-1731 spec FR-012 and FR-013; ADR 0506; ADR 0148; ADR 0239 (2026-11-07 amendment, gap A).
 */
import { Argument, Command, Option, UsageError } from "@stackra/console";
import type { CommandIo } from "@stackra/console";
import { CallIsolation } from "@stackra/actions/contracts";
import type { Container } from "@stackra/container";
import type { Clock, PublicId } from "@stackra/contracts";
import { Str } from "@stackra/validation";

import type { QueueDriver } from "#contracts/ports/queue-driver.port";
import { inJobOwner } from "#core/functions/in-job-owner.function";

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

  /** The container the bound `CallIsolation`, if any, is read from at run time. */
  private readonly container: Container;

  /**
   * @param driver - the queue port.
   * @param clock - the time the jobs are due from.
   * @param container - the container whose `CallIsolation` each owner's redrive runs in, when one is bound.
   */
  constructor(driver: QueueDriver, clock: Clock, container: Container) {
    super();
    this.driver = driver;
    this.clock = clock;
    this.container = container;
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
    const claims = await this.driver.claimDead(
      this.id === undefined ? { limit: ALL_LIMIT } : { id: this.id as PublicId<"job">, limit: 1 },
    );
    const isolation = this.container.has(CallIsolation)
      ? this.container.get(CallIsolation)
      : undefined;
    const retried: string[] = [];
    const skipped: string[] = this.id !== undefined && claims.length === 0 ? [this.id] : [];
    for (const claim of claims) {
      const done = await inJobOwner(isolation, claim.ownerId, claim.id, () =>
        this.driver.redrive(claim.id, this.clock.now()),
      );
      (done ? retried : skipped).push(claim.id);
    }
    if (this.id !== undefined && skipped.length > 0)
      throw new UsageError(`${this.id} is not a failed job, or an identical job is already queued`);
    io.output.success(`Queued ${retried.length} job(s) again`);
    if (skipped.length > 0) io.output.warn(`Skipped ${skipped.length} job(s)`);
    return { retried, skipped };
  }
}
