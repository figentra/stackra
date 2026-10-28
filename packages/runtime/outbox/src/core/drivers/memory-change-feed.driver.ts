/**
 * Stackra file contract:
 * Purpose: `MemoryChangeFeedDriver`, the `ChangeFeed` of a test or a single process: entries and cursors in process
 *          memory, each change stored as JSON as Postgres stores it, positions a zero-padded counter.
 * Boundary: no transaction: an append is kept at once and readable at once (the Postgres driver is the transactional
 *           one and holds back entries of running transactions). There are no scope settings in memory, so an entry
 *           keeps the scope it is appended with, if any. Maintenance drops expired entries; it has no partitions.
 * Runtime: isomorphic
 * Governing contract: ADR 0078 and ADR 0221 (2026-10-28 amendment); ADR 0142 (drivers behind ports); ADR 0266 (memory
 *                     first).
 */
import { Driver } from "@stackra/container";
import { Duration } from "@stackra/contracts";

import { ChangeFeed } from "#contracts/index";
import type { ChangeCursor, ChangeLogReport, ChangeRecord, RowChange } from "#contracts/index";

/** A position: the counter padded so positions sort as text. */
function positionOf(counter: number): string {
  return String(counter).padStart(20, "0");
}

/**
 * Keeps the change log in memory.
 *
 * @example
 * const feed = new MemoryChangeFeedDriver();
 * await feed.append([{ change, meta: {}, occurredAt }]);
 */
export class MemoryChangeFeedDriver extends Driver(ChangeFeed) {
  /** The entries, in log order. */
  private entries: ChangeRecord[] = [];

  /** Consumer name to cursor. */
  private readonly cursors = new Map<string, ChangeCursor>();

  /** The last position handed out. */
  private counter = 0;

  /** Implements `ChangeFeed.append`, documented there. */
  append(entries: readonly Omit<ChangeRecord, "position">[]): Promise<void> {
    for (const entry of entries) {
      this.counter += 1;
      // oxlint-disable-next-line unicorn/prefer-structured-clone -- a JSON round trip on purpose: it is what the column does (Dates become strings, undefined drops)
      const change = JSON.parse(JSON.stringify(entry.change)) as RowChange;
      this.entries.push(Object.freeze({ ...entry, change, position: positionOf(this.counter) }));
    }
    return Promise.resolve();
  }

  /** Implements `ChangeFeed.read`, documented there. */
  read(
    after: string | undefined,
    models: readonly string[],
    limit: number,
  ): Promise<readonly ChangeRecord[]> {
    return Promise.resolve(
      this.entries
        .filter(
          (entry) =>
            (after === undefined || entry.position > after) && models.includes(entry.change.model),
        )
        .slice(0, limit),
    );
  }

  /** Implements `ChangeFeed.positionAt`, documented there. */
  positionAt(at: Date): Promise<string | undefined> {
    const first = this.entries.find((entry) => entry.occurredAt.getTime() >= at.getTime());
    if (first !== undefined) return Promise.resolve(positionOf(Number(first.position) - 1));
    return Promise.resolve(this.entries.at(-1)?.position);
  }

  /** Implements `ChangeFeed.cursor`, documented there. */
  cursor(consumer: string): Promise<ChangeCursor | undefined> {
    return Promise.resolve(this.cursors.get(consumer));
  }

  /** Implements `ChangeFeed.save`, documented there. */
  save(cursor: ChangeCursor): Promise<void> {
    this.cursors.set(cursor.consumer, Object.freeze({ ...cursor }));
    return Promise.resolve();
  }

  /** Implements `ChangeFeed.maintain`, documented there: drops entries older than `retain`. */
  maintain(now: Date, retain: Duration): Promise<ChangeLogReport> {
    const cutoff = now.getTime() - Duration.toMilliseconds(retain);
    const kept = this.entries.filter((entry) => entry.occurredAt.getTime() >= cutoff);
    const dropped = this.entries.length - kept.length;
    this.entries = kept;
    return Promise.resolve({ created: 0, dropped });
  }

  /** Every entry kept, in log order; for a test's assertions. */
  stored(): readonly ChangeRecord[] {
    return [...this.entries];
  }
}
