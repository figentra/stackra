/**
 * Stackra file contract:
 * Purpose: the `ReplicaReads` port: runs a `reads: "replica"` query's `handle` on a read replica, and keeps the
 *          read-your-writes window: after a caller's action commits, that caller's replica queries read the primary
 *          until the window closes, so a caller never reads a replica that has not caught up with its own write.
 * Boundary: an abstract class that is its own token. `@stackra/database` implements it over `Database.onReplica` and
 *           owns the window's length (configuration). The pipeline names the writer (`<scope>:<actor>`), records each
 *           committed action and asks before every replica query; with none bound every query reads the primary. A
 *           driver's memory of writes is per instance: the transport carries the last write across instances as
 *           `CallOptions.lastWriteAt` (a short-lived cookie or header), which `pinned` also reads.
 * Runtime: isomorphic
 * Governing contract: ADR 0057 (decision 6: read replica); ADR 0136 (decision 2: queries have no transaction); gap
 *                     analysis index-tables-cqrs 4 (stackra-402, STA-1504).
 */
import { Port } from "@stackra/contracts";

/**
 * Routes replica reads.
 *
 * @example
 * export class DatabaseReplicaReadsDriver extends Driver(ReplicaReads) {
 *   onReplica<T>(work: () => Promise<T>): Promise<T> {
 *     return Database.current().onReplica(work);
 *   }
 *   // wrote, pinned: the window
 * }
 */
export abstract class ReplicaReads extends Port {
  /** Runs read-only `work` on a replica (or as it is when none is connected), resolving or rejecting as it does. */
  abstract onReplica<T>(work: () => Promise<T>): Promise<T>;

  /** Records that `writer`'s action committed at `at`, which opens its read-your-writes window. */
  abstract wrote(writer: string, at: Date): Promise<void>;

  /**
   * Whether `writer`'s reads at `at` must stay on the primary: its window, opened by a write this instance recorded or
   * by `lastWriteAt` (the transport's carried last write), is still open.
   */
  abstract pinned(writer: string, at: Date, lastWriteAt?: Date): Promise<boolean>;
}
