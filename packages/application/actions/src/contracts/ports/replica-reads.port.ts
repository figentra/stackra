/**
 * Stackra file contract:
 * Purpose: the `ReplicaReads` port: runs a `reads: "replica"` query's `handle` on a read replica, and keeps the
 *          read-your-writes window: after a caller's action commits, that caller's replica queries read the primary
 *          until the window closes, so a caller never reads a replica that has not caught up with its own write.
 * Boundary: an abstract class that is its own token. `@stackra/database` implements it over `Database.onReplica` and
 *           owns the window's length (configuration). The pipeline names the writer (`<scope>:<actor>`), records each
 *           committed action and asks before every replica query; with none bound every query reads the primary. A
 *           driver's memory of writes is per instance: the transport carries the last write across instances as
 *           `CallOptions.lastWriteAt` (a short-lived cookie or header), which `pinned` also reads. `reads` lets
 *           configuration move a query to the replica or back to the primary (per query key or per area) without a code
 *           change; it defaults to the query's own declaration. `onReplica` receives the `ReplicaVisit`, so a driver keeps
 *           a replica lagging past the query's `maxLag`, or behind the caller's last write, away from it.
 * Runtime: isomorphic
 * Governing contract: ADR 0057 (decision 6: read replica); ADR 0136 (decision 2: queries have no transaction); gap
 *                     analysis index-tables-cqrs 4 (stackra-402, STA-1504); data-layer gap scale-performance 11
 *                     (stackra-307, STA-1464: declaration by configuration and the lag guard).
 */
import { Port } from "@stackra/contracts";

import type { ReplicaQuery } from "#contracts/types/replica-query.type";
import type { ReplicaVisit } from "#contracts/types/replica-visit.type";

/**
 * Routes replica reads.
 *
 * @example
 * export class DatabaseReplicaReadsDriver extends Driver(ReplicaReads) {
 *   onReplica<T>(work: () => Promise<T>, visit?: ReplicaVisit): Promise<T> {
 *     return Database.current().onReplica(work, { maxLag: visit?.maxLag ?? Duration.seconds(5) });
 *   }
 *   // reads: the configured override per key or area; wrote, pinned: the window
 * }
 */
export abstract class ReplicaReads extends Port {
  /**
   * Where `query` reads once configuration has had its say: a configured override for its key, else for its area,
   * else its own declaration, which is what this default answers.
   */
  reads(query: ReplicaQuery): "primary" | "replica" {
    return query.declared;
  }

  /**
   * Runs read-only `work` on a replica (or as it is when none is connected), resolving or rejecting as it does. With a
   * `visit`, a replica lagging past its `maxLag` (or the driver's default), or one that has not replayed the visit's
   * writer's last write, is not used: `work` runs on the primary instead.
   */
  abstract onReplica<T>(work: () => Promise<T>, visit?: ReplicaVisit): Promise<T>;

  /** Records that `writer`'s action committed at `at`, which opens its read-your-writes window. */
  abstract wrote(writer: string, at: Date): Promise<void>;

  /**
   * Whether `writer`'s reads at `at` must stay on the primary: its window, opened by a write this instance recorded or
   * by `lastWriteAt` (the transport's carried last write), is still open.
   */
  abstract pinned(writer: string, at: Date, lastWriteAt?: Date): Promise<boolean>;
}
