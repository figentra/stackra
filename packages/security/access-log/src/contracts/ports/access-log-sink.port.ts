/**
 * Stackra file contract:
 * Purpose: `AccessLogSink`, the port access records go to: `AccessLogService` writes one record per logged call, and a
 *          driver (memory, Postgres, or a host's own class) stores it as the next link of its hash chain.
 * Boundary: an abstract class that is its own token, key `access_log.AccessLogSink`. Drivers extend
 *           `Driver(AccessLogSink)` and are named by their file prefix (`memory`, `postgres`); config `sink` picks one,
 *           and a host's own sink (a SIEM forwarder) is a class marked `@Replaces(AccessLogSink)`. A leaf file: it
 *           imports nothing outside src/contracts.
 * Runtime: isomorphic
 * Governing contract: ADR 0212 (decisions 3 and 5: append-only storage, a hash chain, `@AccessLogged`); ADR 0294
 *                     (decisions 15, 16 and 17); ADR 0263.
 */
import { Port } from "@stackra/contracts";

import type { AccessRecord } from "#contracts/types/access-record.type";

/**
 * Stores access records, chained.
 *
 * @example
 * export class SiemAccessLogSinkDriver extends Driver(AccessLogSink) {
 *   async write(record: AccessRecord): Promise<void> {
 *     await this.forwarder.send(await linkAccessRecord(record, this.head));
 *   }
 * }
 */
export abstract class AccessLogSink extends Port {
  /** Type-only port key, so `DriverName<AccessLogSink>` narrows to this port's drivers. */
  declare readonly "~key": "access_log.AccessLogSink";

  /**
   * Appends `record` after the newest link of its chain. A rejection is reported by `AccessLogService` and never
   * reaches the logged call. One call may write several records, one per logged method it runs; `callId` ties them.
   */
  abstract write(record: AccessRecord): Promise<void>;
}
