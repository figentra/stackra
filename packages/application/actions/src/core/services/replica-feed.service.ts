/**
 * Stackra file contract:
 * Purpose: `ReplicaFeed`, the server side of a replica query: a producer records the changes to a replica's rows, and
 *          a replica query answers with the rows changed and the ids removed since the client's opaque cursor, or a
 *          full fill on the first refresh or when the log no longer holds the cursor, with the next cursor and the
 *          "as of" time.
 * Boundary: a platform binding over the `ReplicaLog` port. A partition is the query's locked key and, for a sliced
 *           replica, the caller's value of its `scope` field. The cursor is `<position>.<partition>`, opaque to
 *           clients; one from another partition or above the head refills. The changes since a cursor are read page by
 *           page (the replica's `limit` each) and collapsed to the latest per id, so one answer carries them all. A
 *           producer records in the same unit of work as the change, so the live query's refresh, sent after commit,
 *           never arrives before the change is readable. The pipeline builds one per replica call for `ctx.replica`.
 * Runtime: isomorphic
 * Governing contract: ADR 0338 (decision 3: an opaque, monotonic change cursor per replica, the first fill is the only
 *                     full download, the "as of" time, a scoped replica); ADR 0315 (decision 1: the refresh signal).
 */
import { type AnyClass, kindOf, Service } from "@stackra/container";
import { Duration, type ScopeRef } from "@stackra/contracts";
import { duration } from "@stackra/validation";

import type { ReplicaLog } from "#contracts/ports/replica-log.port";
import type { ReplicaChange } from "#contracts/types/replica-change.type";
import type { ReplicaRow } from "#contracts/types/replica-row.type";
import { ACTION_REGISTRY } from "#core/constants/action-registry.constant";
import type { QueryReplica } from "#core/types/query-replica.type";
import type { ReplicaBounds } from "#core/types/replica-bounds.type";
import type { ReplicaPage } from "#core/types/replica-page.type";

/**
 * Records and serves replica changes.
 *
 * @example
 * // a producer, in the action that completes a sale (inside its unit of work)
 * await this.replicas.record(RecentSalesQuery, [{ id: sale.id, row: { id: sale.id, at: sale.soldAt, data } }], {
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
  async page(
    query: AnyClass,
    request: { readonly cursor?: string; readonly within?: ScopeRef; readonly at: Date },
    fill: (bounds: ReplicaBounds) => Promise<readonly ReplicaRow[]>,
    slice?: string,
  ): Promise<ReplicaPage> {
    const { partition, replica } = this.replicaOf(query, slice);
    const after = this.positionOf(request.cursor, partition);
    const since =
      after === undefined
        ? undefined
        : await this.since(partition, after, replica.limit, request.within);
    if (since !== undefined)
      return Object.freeze({
        rows: [...since.latest].flatMap(([, row]) => (row === undefined ? [] : [row])),
        removed: [...since.latest].flatMap(([id, row]) => (row === undefined ? [id] : [])),
        cursor: this.cursorOf(partition, since.position),
        asOf: request.at,
        full: false,
      });
    // The head is read before the fill, so a change made during the fill is sent again next time (upserts by id).
    const head = await this.log.head(partition);
    const bounds = Object.freeze({
      since: new Date(request.at.getTime() - Duration.toMilliseconds(duration(replica.window))),
      limit: replica.limit,
    });
    const rows = await fill(bounds);
    return Object.freeze({
      rows: rows.slice(0, replica.limit),
      removed: [],
      cursor: this.cursorOf(partition, head),
      asOf: request.at,
      full: true,
    });
  }

  /**
   * Every visible change of `partition` after `after`, collapsed to the latest row per id (`undefined` for a removed
   * one), and the position read up to; `undefined` when the log no longer holds a position on the way.
   */
  private async since(
    partition: string,
    after: number,
    limit: number,
    within: ScopeRef | undefined,
  ): Promise<
    { readonly latest: Map<string, ReplicaRow | undefined>; readonly position: number } | undefined
  > {
    const latest = new Map<string, ReplicaRow | undefined>();
    let position = after;
    for (;;) {
      const read = await this.log.read(partition, position, limit, within);
      if (read === undefined) return undefined;
      for (const change of read.changes) latest.set(change.id, change.row);
      position = read.position;
      if (!read.more) return { latest, position };
    }
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
