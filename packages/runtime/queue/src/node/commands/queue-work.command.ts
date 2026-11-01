/**
 * Stackra file contract:
 * Purpose: `QueueWorkCommand`, `queue:work`: runs `QueueWorkerService` on one queue until the run is stopped.
 * Boundary: the service must already be connected to the host's container (the runtime does it, as for every worker);
 *           an unconnected service makes the run fail with its own error. `--queue` picks the queue (`default`) and
 *           `--concurrency` the loops. The service reports no per-job event, so the run shows one status line.
 *           SIGINT or SIGTERM aborts the signal, the loops finish their current job, and the run exits 130 or 143.
 * Runtime: node
 * Governing contract: STA-1731 spec FR-012; ADR 0506; ADR 0148.
 */
import { Command, Option } from "@stackra/console";
import type { CommandIo } from "@stackra/console";
import { Int, Str } from "@stackra/validation";

import { JOB_DEFAULTS } from "#core/constants/job-defaults.constant";
import type { QueueWorkerService } from "#node/services/queue-worker.service";

/** Works a queue. */
export class QueueWorkCommand extends Command({
  name: "queue:work",
  description: "Run jobs from a queue until stopped",
}) {
  /** The queue to work. */
  @Option({ description: "The queue to work" })
  @Str
  queue: string = JOB_DEFAULTS.queue;

  /** How many jobs run at once. */
  @Option({ description: "Jobs to run at once" })
  @Int({ min: 1 })
  concurrency = 1;

  /** The worker. */
  private readonly worker: QueueWorkerService;

  /**
   * @param worker - the job runner.
   */
  constructor(worker: QueueWorkerService) {
    super();
    this.worker = worker;
  }

  /** Works until `io.signal` aborts; returns the queue it worked. */
  async handle(io: CommandIo): Promise<Readonly<Record<string, unknown>>> {
    const spinner = io.output.spinner(
      `Working queue "${this.queue}" with ${this.concurrency} loop(s); stop with Ctrl-C`,
    );
    try {
      await this.worker.work(this.queue, { signal: io.signal, concurrency: this.concurrency });
    } catch (error) {
      spinner.stop("The worker failed", false);
      throw error;
    }
    spinner.stop(`Stopped working queue "${this.queue}"`);
    return { queue: this.queue };
  }
}
