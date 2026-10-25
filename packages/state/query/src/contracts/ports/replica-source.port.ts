/**
 * Stackra file contract:
 * Purpose: the `ReplicaSource` port: asks the server for the changes of one replica since a cursor (every record when
 *          the cursor is `null`), within the device's slice of the replica's scope dimension (ADR 0338 decision 3).
 * Boundary: an abstract class that is its own token, keyed `query.ReplicaSource`. `@stackra/clients` implements it by
 *           calling the replica query by its versioned key with `{ cursor, ...slice }` as input. The answer is checked
 *           by `ReplicaStore`, which trusts nothing it did not parse. A throw means not refreshed: the replica keeps
 *           what it holds and its "as of" time.
 * Runtime: isomorphic
 * Governing contract: ADR 0338 (decision 3); ADR 0315 (live queries); ADR 0294 (decisions 15 and 16).
 */
import { Port } from "@stackra/contracts";

import type { ReplicaChanges } from "#contracts/types/replica-changes.type";

/**
 * Reads replica changes.
 *
 * @example
 * export class ClientReplicaSourceDriver extends Driver(ReplicaSource) {
 *   changes(query: string, cursor: string | null, slice: Readonly<Record<string, string>>) {
 *     return this.client.query(query, { cursor, ...slice });
 *   }
 * }
 */
export abstract class ReplicaSource extends Port {
  /** Type-only port key, so `DriverName<ReplicaSource>` narrows to this port's drivers. */
  declare readonly "~key": "query.ReplicaSource";

  /**
   * The changes of the replica query keyed `query` (`sales.sale.recent@1`) since `cursor`, limited to `slice`
   * (`{ legalEntityId: "len_1" }`, empty for an unscoped replica).
   *
   * @throws Error when the server was not reached or refused the read.
   */
  abstract changes(
    query: string,
    cursor: string | null,
    slice: Readonly<Record<string, string>>,
  ): Promise<ReplicaChanges>;
}
