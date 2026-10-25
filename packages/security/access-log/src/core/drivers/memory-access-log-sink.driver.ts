/**
 * Stackra file contract:
 * Purpose: `MemoryAccessLogSinkDriver`, the `memory` sink: one hash chain in process memory, for tests and
 *          `sink: "memory"`.
 * Boundary: the memory driver that ships with the production one (ADR 0266 d2); its name is the file prefix. Writes
 *           are queued, so concurrent calls never fork the chain. Records live for the container's life; `records()`
 *           is what the `toHaveLoggedAccess` matcher and a verification read. Isomorphic, so it ships from `.`.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decisions 15 and 16); ADR 0266 (decision 2); ADR 0212 (decision 3).
 */
import { Driver } from "@stackra/container";

import { AccessLogSink } from "#contracts/ports/access-log-sink.port";
import type { AccessLink } from "#contracts/types/access-link.type";
import type { AccessRecord } from "#contracts/types/access-record.type";
import { linkAccessRecord } from "#core/functions/link-access-record.function";

/**
 * Keeps one chain in memory.
 *
 * @example
 * export class AccessLogConfig extends BaseAccessLogConfig {
 *   override sink: DriverName<AccessLogSink> = "memory";
 * }
 */
export class MemoryAccessLogSinkDriver extends Driver(AccessLogSink) {
  /** The chain, oldest first. */
  private readonly links: AccessLink[] = [];

  /** The last queued write, so the next one links after it. */
  private tail: Promise<void> = Promise.resolve();

  /** Appends `record` as the next link, after every write already queued. */
  write(record: AccessRecord): Promise<void> {
    const written = this.tail.then(async () => {
      this.links.push(await linkAccessRecord(record, this.links.at(-1)));
    });
    this.tail = written.catch(() => undefined);
    return written;
  }

  /** Every stored link in write order. */
  records(): readonly AccessLink[] {
    return [...this.links];
  }
}
