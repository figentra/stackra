/**
 * Stackra file contract:
 * Purpose: `MemoryReplicaLogDriver`, the in-process `ReplicaLog`: each partition's changes in an array whose index is
 *          the position, for tests, local runs and single-instance memory deployments.
 * Boundary: one process only; a restart empties every partition, so an older cursor is above the head and the client
 *           fills again. A read returns only entries whose scope path is the caller's or below it; an entry without a
 *           scope reaches only a caller without one, unless it cascades: a `cascade` change also reaches every caller at
 *           its scope node or below it (one without a scope reaches every caller).
 * Runtime: isomorphic
 * Governing contract: ADR 0338 (decision 3); ADR 0327 (scope paths); ADR 0456 (decision 3: cascade).
 */
import { Driver } from "@stackra/container";
import type { ScopeRef } from "@stackra/contracts";

import { ReplicaLog } from "#contracts/ports/replica-log.port";
import type { ReplicaChange } from "#contracts/types/replica-change.type";
import type { ReplicaRead } from "#contracts/types/replica-read.type";

/** Whether `path` is `node` or below it. */
const under = (path: string, node: string): boolean => path === node || path.startsWith(`${node}.`);

/** One stored change and the scope of its record. */
type Entry = { readonly change: ReplicaChange; readonly scope: ScopeRef | undefined };

/**
 * Keeps replica changes in memory.
 *
 * @example
 * const log = new MemoryReplicaLogDriver();
 * await log.append("sales.sale.recent@1|", [{ id: "sal_1", row }], scope); // 1
 * await log.read("sales.sale.recent@1|", 0, 100, scope); // { changes: [{ id: "sal_1", row }], position: 1, more: false }
 */
export class MemoryReplicaLogDriver extends Driver(ReplicaLog) {
  /** Partition to its entries; entry `i` sits at position `i + 1`. */
  private readonly partitions = new Map<string, Entry[]>();

  /** Appends the changes and returns the new head. */
  async append(
    partition: string,
    changes: readonly ReplicaChange[],
    scope: ScopeRef | undefined,
  ): Promise<number> {
    const entries = this.partitions.get(partition) ?? [];
    for (const change of changes) entries.push({ change: Object.freeze({ ...change }), scope });
    this.partitions.set(partition, entries);
    return entries.length;
  }

  /** The partition's last position. */
  async head(partition: string): Promise<number> {
    return this.partitions.get(partition)?.length ?? 0;
  }

  /**
   * Up to `limit` visible changes after `after`.
   *
   * shortcut: every change is kept, so only a position above the head answers `undefined`; the durable driver prunes
   * past the replica's window and answers `undefined` below what it keeps.
   */
  async read(
    partition: string,
    after: number,
    limit: number,
    within: ScopeRef | undefined,
  ): Promise<ReplicaRead | undefined> {
    const entries = this.partitions.get(partition) ?? [];
    if (!Number.isSafeInteger(after) || after < 0 || after > entries.length) return undefined;
    const changes: ReplicaChange[] = [];
    let position = after;
    while (position < entries.length && changes.length < limit) {
      const { change, scope } = entries[position] as Entry;
      position += 1;
      if (within === undefined || this.visible(change, scope, within)) changes.push(change);
    }
    return { changes, position, more: position < entries.length };
  }

  /** Whether a change stamped `scope` reaches a caller in `within`: at or below it, or cascading from at or above it. */
  private visible(change: ReplicaChange, scope: ScopeRef | undefined, within: ScopeRef): boolean {
    if (scope === undefined) return change.cascade === true;
    return (
      under(scope.path, within.path) || (change.cascade === true && under(within.path, scope.path))
    );
  }
}
