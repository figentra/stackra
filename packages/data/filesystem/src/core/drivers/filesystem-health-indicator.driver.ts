/**
 * Stackra file contract:
 * Purpose: `FilesystemHealthIndicatorDriver`, this package's driver of the contracts `HealthIndicator` port (`filesystem`): it asks the disk whether `health.path` exists, one metadata read on the configured disk (local, S3, GCS). The probe is
 *          bounded by `FilesystemConfig.health.timeout`; a probe that fails or runs past it is `down`, or `degraded` when
 *          `health.critical` is off, so `/readyz` fails a deploy whose the disk does not answer.
 * Boundary: `Driver(HealthIndicator)`, so `/readyz` finds it among the bound `HealthIndicator`s. It probes through
 *           the `FileSystem` port only; it writes nothing, and a missing path is an answer. A failure reports the error's name, never its message, and never throws.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 16 and 17), ADR 0184, registry gap R-27; gap analysis devx-ops "Health
 *                     checks" (P0, owner D10).
 */
import { Driver } from "@stackra/container";
import { Duration, HealthIndicator, HealthStatus } from "@stackra/contracts";
import type { HealthReport } from "@stackra/contracts";

import type { FilesystemConfig } from "#config/filesystem.config";
import type { FileSystem } from "#contracts/ports/file-system.port";

/** Whether the disk answers a cheap probe in time. */
export class FilesystemHealthIndicatorDriver extends Driver(HealthIndicator) {
  /** The dependency this indicator reports on. */
  override readonly name = "filesystem";

  private readonly disk: FileSystem;

  private readonly health: FilesystemConfig["health"];

  /**
   * @param disk - the bound `FileSystem`.
   * @param config - `health` holds the timeout and whether a failure is critical.
   */
  constructor(disk: FileSystem, config: FilesystemConfig) {
    super();
    this.disk = disk;
    this.health = config.health;
  }

  /** Asks whether the probe path exists. */
  override async check(): Promise<HealthReport> {
    const started = Date.now();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const late = new Promise<never>((_, reject) => {
      timer = setTimeout(
        () =>
          reject(Object.assign(new Error("filesystem probe timed out"), { name: "TimeoutError" })),
        Duration.toMilliseconds(this.health.timeout),
      );
    });
    try {
      await Promise.race([this.disk.exists(this.health.path), late]);
      return { status: HealthStatus.Up, latency: Duration.seconds((Date.now() - started) / 1000) };
    } catch (error) {
      return {
        status: this.health.critical ? HealthStatus.Down : HealthStatus.Degraded,
        detail: `the disk did not answer (${(error as Error).name})`,
      };
    } finally {
      clearTimeout(timer);
    }
  }
}
