/**
 * Stackra file contract:
 * Purpose: `RealtimeHealthIndicatorDriver`, this package's driver of the contracts `HealthIndicator` port (`realtime`): it publishes a zero member count for a probe room through the fan-out between instances (Valkey when deployed), which every receiver drops. The probe is
 *          bounded by `RealtimeConfig.health.timeout`; a probe that fails or runs past it is `down`, or `degraded` when
 *          `health.critical` is off, so `/readyz` fails a deploy whose the realtime fan-out does not answer.
 * Boundary: `Driver(HealthIndicator)`, so `/readyz` finds it among the bound `HealthIndicator`s. It probes through
 *           the `RealtimeFanout` port only; the probe room holds no member, so a receiver records nothing. A failure reports the error's name, never its message, and never throws.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 16 and 17), ADR 0184, registry gap R-27; gap analysis devx-ops "Health
 *                     checks" (P0, owner D10).
 */
import { Driver } from "@stackra/container";
import { Duration, HealthIndicator, HealthStatus } from "@stackra/contracts";
import type { HealthReport } from "@stackra/contracts";

import type { RealtimeConfig } from "#config/realtime.config";
import type { RealtimeFanout } from "#contracts/ports/realtime-fanout.port";

/** Whether the realtime fan-out answers a cheap probe in time. */
export class RealtimeHealthIndicatorDriver extends Driver(HealthIndicator) {
  /** The dependency this indicator reports on. */
  override readonly name = "realtime";

  private readonly fanout: RealtimeFanout;

  private readonly health: RealtimeConfig["health"];

  /**
   * @param fanout - the bound `RealtimeFanout`.
   * @param config - `health` holds the timeout and whether a failure is critical.
   */
  constructor(fanout: RealtimeFanout, config: RealtimeConfig) {
    super();
    this.fanout = fanout;
    this.health = config.health;
  }

  /** Publishes the probe room's zero count. */
  override async check(): Promise<HealthReport> {
    const started = Date.now();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const late = new Promise<never>((_, reject) => {
      timer = setTimeout(
        () =>
          reject(Object.assign(new Error("realtime probe timed out"), { name: "TimeoutError" })),
        Duration.toMilliseconds(this.health.timeout),
      );
    });
    try {
      await Promise.race([
        this.fanout.publish({
          kind: "room-members",
          room: "health:probe",
          origin: "health",
          members: 0,
        }),
        late,
      ]);
      return { status: HealthStatus.Up, latency: Duration.seconds((Date.now() - started) / 1000) };
    } catch (error) {
      return {
        status: this.health.critical ? HealthStatus.Down : HealthStatus.Degraded,
        detail: `the realtime fan-out did not answer (${(error as Error).name})`,
      };
    } finally {
      clearTimeout(timer);
    }
  }
}
