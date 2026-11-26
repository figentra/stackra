/**
 * Stackra file contract:
 * Purpose: `DatabaseReplicaReadsDriver`, the action pipeline's `ReplicaReads` on the connected database: where a query
 *          reads is `DatabaseConfig.replicaReads` (its key's override, else its area's, else its own `reads`); a replica
 *          query's `handle` runs through `Database.onReplica` with the lag guard (its `maxLag`, else
 *          `replicaReads.maxLag`, and the caller's last write as `after`); and a caller whose action committed within
 *          `DatabaseConfig.readYourWrites` (recorded here, or carried by the transport as `lastWriteAt`) keeps reading
 *          the primary, so it never reads a replica behind its own write.
 * Boundary: a driver of the @stackra/actions port (driver name `database`); it reads `Database.current()`, so a driver
 *           with no replica connected runs the work on the primary. The recorded writes live in this instance's memory
 *           and are forgotten once their window closes; another instance learns of a write only through `lastWriteAt`.
 * Runtime: node
 * Governing contract: ADR 0057 (decision 6: read replica); ADR 0142 (drivers); gap analysis index-tables-cqrs 4
 *                     (stackra-402, STA-1504); data-layer gap scale-performance 11 (stackra-307, STA-1464: replica
 *                     reads by declaration and configuration, the lag guard).
 */
import { ReplicaReads } from "@stackra/actions/contracts";
import type { ReplicaQuery, ReplicaVisit } from "@stackra/actions/contracts";
import { Driver } from "@stackra/container";
import { Duration } from "@stackra/contracts";

import type { DatabaseConfig } from "#config/database.config";
import { Database } from "#core/ports/database.port";
import type { ReplicaReadsSettings } from "#core/types/replica-reads-settings.type";

/** How many writers may be remembered before closed windows are swept. */
const SWEEP_AT = 1000;

/**
 * Replica reads with a read-your-writes window.
 *
 * @example
 * // generated wiring: { port: ReplicaReads, candidates: { database: () => import("@stackra/database/node").then((m) => m.DatabaseReplicaReadsDriver) } }
 */
export class DatabaseReplicaReadsDriver extends Driver(ReplicaReads) {
  /** The window in milliseconds. */
  private readonly window: number;

  /** When each writer last committed, in milliseconds. */
  private readonly writes = new Map<string, number>();

  /** The default lag and the overrides. */
  private readonly settings: ReplicaReadsSettings;

  /**
   * @param config - `readYourWrites` is the window; `replicaReads` the default lag and where queries read.
   */
  constructor(config: DatabaseConfig) {
    super();
    this.window = Duration.toMilliseconds(config.readYourWrites);
    this.settings = config.replicaReads;
  }

  /** The configured place of `query`'s key, else of its area, else its own declaration. */
  override reads(query: ReplicaQuery): "primary" | "replica" {
    return (
      (Object.hasOwn(this.settings.queries, query.key)
        ? this.settings.queries[query.key]
        : undefined) ??
      this.settings.areas[query.area] ??
      query.declared
    );
  }

  /**
   * Runs `work` on a replica of the connected database no further behind than the visit's `maxLag` (else
   * `replicaReads.maxLag`) and replayed through the writer's last write (remembered here or carried); on the primary
   * when no replica is connected or the replica is not that fresh.
   */
  override onReplica<T>(work: () => Promise<T>, visit?: ReplicaVisit): Promise<T> {
    const last = Math.max(
      (visit === undefined ? undefined : this.writes.get(visit.writer)) ?? Number.NEGATIVE_INFINITY,
      visit?.lastWriteAt?.getTime() ?? Number.NEGATIVE_INFINITY,
    );
    return Database.current().onReplica(work, {
      maxLag: visit?.maxLag ?? this.settings.maxLag,
      ...(Number.isFinite(last) ? { after: new Date(last) } : {}),
    });
  }

  /** Remembers `writer`'s write, sweeping closed windows once many writers are remembered. */
  override async wrote(writer: string, at: Date): Promise<void> {
    const time = at.getTime();
    if (this.writes.size >= SWEEP_AT)
      for (const [key, last] of this.writes)
        if (time - last >= this.window) this.writes.delete(key);
    this.writes.set(writer, Math.max(time, this.writes.get(writer) ?? time));
  }

  /** Whether the latest of the remembered write and `lastWriteAt` is less than the window before `at`. */
  override async pinned(writer: string, at: Date, lastWriteAt?: Date): Promise<boolean> {
    const last = Math.max(
      this.writes.get(writer) ?? Number.NEGATIVE_INFINITY,
      lastWriteAt?.getTime() ?? Number.NEGATIVE_INFINITY,
    );
    return at.getTime() - last < this.window;
  }
}
