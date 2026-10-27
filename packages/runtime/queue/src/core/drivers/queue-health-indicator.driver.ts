/**
 * Stackra file contract:
 * Purpose: `QueueHealthIndicatorDriver`, this package's driver of the contracts `HealthIndicator` port (`queue`): it lists at most one dead letter, a read every driver answers from its store. The probe is
 *          bounded by `QueueConfig.health.timeout`; a probe that fails or runs past it is `down`, or `degraded` when
 *          `health.critical` is off, so `/readyz` fails a deploy whose the queue does not answer.
 * Boundary: `Driver(HealthIndicator)`, so `/readyz` finds it among the bound `HealthIndicator`s. It probes through
 *           the `QueueDriver` port only; it reserves, retries and removes nothing. A failure reports the error's name, never its message, and never throws.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 16 and 17), ADR 0184, registry gap R-27; gap analysis devx-ops "Health
 *                     checks" (P0, owner D10).
 */
import { Driver } from "@stackra/container";
import { Duration, HealthIndicator, HealthStatus } from "@stackra/contracts";
import type { HealthReport } from "@stackra/contracts";

import type { QueueConfig } from "#config/queue.config";
import type { QueueDriver } from "#contracts/ports/queue-driver.port";

/** Whether the queue answers a cheap probe in time. */
export class QueueHealthIndicatorDriver extends Driver(HealthIndicator) {
  /** The dependency this indicator reports on. */
  override readonly name = "queue";

  private readonly queue: QueueDriver;

  private readonly health: QueueConfig["health"];

  /**
   * @param queue - the bound `QueueDriver`.
   * @param config - `health` holds the timeout and whether a failure is critical.
   */
  constructor(queue: QueueDriver, config: QueueConfig) {
    super();
    this.queue = queue;
    this.health = config.health;
  }

  /** Lists one dead letter of any queue. */
  override async check(): Promise<HealthReport> {
    const started = Date.now();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const late = new Promise<never>((_, reject) => {
      timer = setTimeout(
        () => reject(Object.assign(new Error("queue probe timed out"), { name: "TimeoutError" })),
        Duration.toMilliseconds(this.health.timeout),
      );
    });
    try {
      await Promise.race([this.queue.deadLetters(undefined, 1), late]);
      return { status: HealthStatus.Up, latency: Duration.seconds((Date.now() - started) / 1000) };
    } catch (error) {
      return {
        status: this.health.critical ? HealthStatus.Down : HealthStatus.Degraded,
        detail: `the queue did not answer (${(error as Error).name})`,
      };
    } finally {
      clearTimeout(timer);
    }
  }
}
