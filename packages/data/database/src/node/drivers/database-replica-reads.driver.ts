/**
 * Stackra file contract:
 * Purpose: `DatabaseReplicaReadsDriver`, the action pipeline's `ReplicaReads` on the connected database: a
 *          `reads: "replica"` query's `handle` runs through `Database.onReplica`, and a caller whose action committed
 *          within `DatabaseConfig.readYourWrites` (recorded here, or carried by the transport as `lastWriteAt`) keeps
 *          reading the primary, so it never reads a replica behind its own write.
 * Boundary: a driver of the @stackra/actions port (driver name `database`); it reads `Database.current()`, so a driver
 *           with no replica connected runs the work on the primary. The recorded writes live in this instance's memory
 *           and are forgotten once their window closes; another instance learns of a write only through `lastWriteAt`.
 * Runtime: node
 * Governing contract: ADR 0057 (decision 6: read replica); ADR 0142 (drivers); gap analysis index-tables-cqrs 4
 *                     (stackra-402, STA-1504).
 */
import { ReplicaReads } from "@stackra/actions/contracts";
import { Driver } from "@stackra/container";
import { Duration } from "@stackra/contracts";

import type { DatabaseConfig } from "#config/database.config";
import { Database } from "#core/ports/database.port";

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

  /**
   * @param config - `readYourWrites` is the window.
   */
  constructor(config: DatabaseConfig) {
    super();
    this.window = Duration.toMilliseconds(config.readYourWrites);
  }

  /** Runs `work` on a replica of the connected database (on the primary when none is connected). */
  override onReplica<T>(work: () => Promise<T>): Promise<T> {
    return Database.current().onReplica(work);
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
