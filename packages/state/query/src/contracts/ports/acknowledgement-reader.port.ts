/**
 * Stackra file contract:
 * Purpose: the `AcknowledgementReader` port: asks the server for a device's last acknowledged sequence, the highest
 *          sequence it applied or rejected (ADR 0338 decision 4). An answer is also proof of a sync, which is how
 *          `OfflineLock` knows the offline limit has not passed.
 * Boundary: an abstract class that is its own token, keyed `query.AcknowledgementReader`. `@stackra/clients` implements
 *           it over the query named by its `DEVICE_ORDER` constant. It resolves only on the server's answer; offline, a
 *           timeout or a refusal rejects, and the caller counts that as no sync.
 * Runtime: isomorphic
 * Governing contract: ADR 0338 (decisions 1 and 4); ADR 0294 (decisions 15 and 16).
 */
import { Port } from "@stackra/contracts";

/**
 * Reads a device's last acknowledged sequence.
 *
 * @example
 * export class ClientAcknowledgementReaderDriver extends Driver(AcknowledgementReader) {
 *   lastAcknowledged(deviceId: string): Promise<number | null> {
 *     return this.client.acknowledged(deviceId);
 *   }
 * }
 */
export abstract class AcknowledgementReader extends Port {
  /** Type-only port key, so `DriverName<AcknowledgementReader>` narrows to this port's drivers. */
  declare readonly "~key": "query.AcknowledgementReader";

  /**
   * The highest sequence the server applied or rejected for `deviceId`, or `null` when it has none.
   *
   * @throws Error when the server was not reached or refused the read.
   */
  abstract lastAcknowledged(deviceId: string): Promise<number | null>;
}
