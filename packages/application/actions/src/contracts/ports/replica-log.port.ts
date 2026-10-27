/**
 * Stackra file contract:
 * Purpose: the `ReplicaLog` port: the append-only change log behind each replica partition (a replica query and, when
 *          scoped, one value of its dimension), whose monotonic positions the opaque change cursors encode.
 * Boundary: an abstract class that is its own token. Each entry keeps the scope node of its record, and a read returns
 *           only entries within the caller's scope (the row-level rule: an entry's path is the scope's or below it),
 *           plus a `cascade` change stamped at the scope or above it, or with no scope (ADR 0456 decision 3).
 *           `read` answers `undefined` for a position it does not hold, so the reader fills again. This package ships
 *           the memory driver; a durable driver, which prunes past the replica's window, comes through
 *           `@stackra/database`.
 * Runtime: isomorphic
 * Governing contract: ADR 0338 (decision 3: an opaque, monotonic change cursor per replica); ADR 0327 (scope paths);
 *                     ADR 0456 (decision 3: a cascading change reaches the readers below its node);
 *                     ADR 0263 (ports are classes).
 */
import { Port } from "@stackra/contracts";
import type { ScopeRef } from "@stackra/contracts";

import type { ReplicaChange } from "#contracts/types/replica-change.type";
import type { ReplicaRead } from "#contracts/types/replica-read.type";

/**
 * Keeps each replica partition's changes in order.
 *
 * @example
 * const head = await log.append("sales.sale.recent@1|le_1", [{ id: sale.id, row }], scope);
 * const page = await log.read("sales.sale.recent@1|le_1", 40, 500, callerScope);
 */
export abstract class ReplicaLog extends Port {
  /** Appends `changes` to `partition`, each stamped with `scope`, and resolves to the new last position. */
  abstract append(
    partition: string,
    changes: readonly ReplicaChange[],
    scope: ScopeRef | undefined,
  ): Promise<number>;

  /** The position of the last entry of `partition`; 0 when it has none. */
  abstract head(partition: string): Promise<number>;

  /**
   * Up to `limit` changes of `partition` after `after` that lie within `within`, or cascade from its node or an
   * ancestor of it (every entry when `within` is absent); `undefined` when `after` is above the head or older than what the log still keeps.
   */
  abstract read(
    partition: string,
    after: number,
    limit: number,
    within: ScopeRef | undefined,
  ): Promise<ReplicaRead | undefined>;
}
