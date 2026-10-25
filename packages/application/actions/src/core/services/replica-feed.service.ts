/**
 * Stackra file contract:
 * Purpose: `ReplicaFeed`, the server side of a replica query: a producer records the changes to a replica's rows, and
 *          a replica query answers with the changes since the client's opaque cursor, or a full fill on the first
 *          refresh or when the log no longer holds the cursor, with the next cursor and the "as of" time.
 * Boundary: a platform binding over the `ReplicaLog` port. A partition is the query's locked key and, for a sliced
 *           replica, the caller's value of its `scope` field. The cursor is `<position>.<partition>`, opaque to
 *           clients; one from another partition or above the head refills. A producer records in the same unit of
 *           work as the change, so the live query's refresh, sent after commit, never arrives before the change is
 *           readable. The pipeline builds one per replica call for `ctx.replica`.
 * Runtime: isomorphic
 * Governing contract: ADR 0338 (decision 3: an opaque, monotonic change cursor per replica, the first fill is the only
 *                     full download, the "as of" time, a scoped replica); ADR 0315 (decision 1: the refresh signal).
 */
import { type AnyClass, kindOf, Service } from "@stackra/container";
import { Duration, type ScopeRef } from "@stackra/contracts";
import { duration } from "@stackra/validation";

import type { ReplicaLog } from "#contracts/ports/replica-log.port";
import type { ReplicaChange } from "#contracts/types/replica-change.type";
import { ACTION_REGISTRY } from "#core/constants/action-registry.constant";
import type { QueryReplica } from "#core/types/query-replica.type";
import type { ReplicaBounds } from "#core/types/replica-bounds.type";
import type { ReplicaPage } from "#core/types/replica-page.type";

/**
 * Records and serves replica changes.
 *
 * @example
 * // a producer, in the action that completes a sale (inside its unit of work)
 * await this.replicas.record(RecentSalesQuery, [{ id: sale.id, row: SaleRow.of(sale) }], {
 *   slice: sale.legalEntityId,
 *   scope: ctx.scope,
 * });
 */
export class ReplicaFeed extends Service {
  /** Where each partition's changes are kept. */
  private readonly log: ReplicaLog;

  /** @param log - the bound replica log. */
  constructor(log: ReplicaLog) {
    super();
    this.log = log;
  }

  /**
   * Appends `changes` to the replica of `query`, stamped with the records' `scope`.
   *
   * @param options.slice - the records' value of the replica's `scope` field; required exactly when it declares one.
   * @throws TypeError when `query` declares no replica, or the slice does not match its `scope`.
   */
  async record(
    query: AnyClass,
    changes: readonly ReplicaChange[],
    options: { readonly slice?: string; readonly scope?: ScopeRef } = {},
  ): Promise<void> {
    const { partition } = this.replicaOf(query, options.slice);
    await this.log.append(partition, changes, options.scope);
  }

  /**
   * The answer to one refresh of the replica of `query`.
   *
   * @param request - the cursor the client sent, the caller's scope and the call's instant.
   * @param fill - reads the full replica within the bounds.
   * @param slice - the caller's authorized value of the replica's `scope` field.
   * @throws TypeError when `query` declares no replica, or the slice does not match its `scope`.
   */
  async page<R>(
    query: AnyClass,
    request: { readonly cursor?: string; readonly within?: ScopeRef; readonly at: Date },
    fill: (bounds: ReplicaBounds) => Promise<readonly R[]>,
    slice?: string,
  ): Promise<ReplicaPage<R>> {
    const { partition, replica } = this.replicaOf(query, slice);
    const after = this.positionOf(request.cursor, partition);
    if (after !== undefined) {
      const read = await this.log.read(partition, after, replica.limit, request.within);
      if (read !== undefined)
        return Object.freeze({
          full: false,
          changes: read.changes as readonly ReplicaChange<R>[],
          more: read.more,
          cursor: this.cursorOf(partition, read.position),
          asOf: request.at,
        });
    }
    // The head is read before the fill, so a change made during the fill is sent again next time (upserts by id).
    const head = await this.log.head(partition);
    const since = new Date(
      request.at.getTime() - Duration.toMilliseconds(duration(replica.window)),
    );
    const rows = await fill(Object.freeze({ since, limit: replica.limit }));
    return Object.freeze({
      full: true,
      rows: rows.slice(0, replica.limit),
      cursor: this.cursorOf(partition, head),
      asOf: request.at,
    });
  }

  /** The replica option of `query` and the partition of `slice`. */
  private replicaOf(
    query: AnyClass,
    slice: string | undefined,
  ): { readonly partition: string; readonly replica: QueryReplica } {
    const record = kindOf(query);
    const options: Readonly<Record<string, unknown>> =
      record?.kind === "query" ? record.options : {};
    const replica = options.replica as QueryReplica | undefined;
    if (replica === undefined)
      throw new TypeError(
        `${query.name} declares no replica: add replica: { of, window, limit } to its Query({...})`,
      );
    if ((replica.scope === undefined) !== (slice === undefined))
      throw new TypeError(
        replica.scope === undefined
          ? `${query.name}'s replica has no scope, so it takes no slice`
          : `${query.name}'s replica is scoped by ${replica.scope}: pass the caller's ${replica.scope}`,
      );
    const key = ACTION_REGISTRY.get(query)?.key ?? String(options.key);
    return { partition: `${key}|${slice ?? ""}`, replica };
  }

  /** The opaque cursor of `position` in `partition`. */
  private cursorOf(partition: string, position: number): string {
    return `${position}.${encodeURIComponent(partition)}`;
  }

  /** The position `cursor` names in `partition`; `undefined` for no cursor, a malformed one or another partition's. */
  private positionOf(cursor: string | undefined, partition: string): number | undefined {
    if (cursor === undefined) return undefined;
    const dot = cursor.indexOf(".");
    const position = Number(cursor.slice(0, dot));
    return dot > 0 &&
      cursor.slice(dot + 1) === encodeURIComponent(partition) &&
      Number.isSafeInteger(position) &&
      position >= 0
      ? position
      : undefined;
  }
}
