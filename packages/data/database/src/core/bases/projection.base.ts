/**
 * Stackra file contract:
 * Purpose: `Projection<Source>({ key })`, the kind base of a read model of another service's data, fed by that
 *          service's integration events: `class OrderBook extends Projection<OrderBookRow>({ key: "order_book" }) {}`
 *          in a module's `models/<name>.projection.ts`. The listeners of the source's events inject it and call `put`
 *          and `remove` with the event's time; reports and queries call `get` and `list`, now or `asOf` a past moment.
 * Boundary: called only, with the stored row as the type argument (gone at runtime). A binding the container builds:
 *           its own constructor dependencies are the subclass's, and it calls `super()` with none; the database is
 *           `Database.current()` and every call runs in the caller's transaction (a write opens one when there is
 *           none). Rows live in this package's `database.projection_rows`, one version per write, keyed by projection
 *           key, scope and record id, under the forced ancestor policy on `app.scope_paths`: reads see the session's
 *           granted scopes and no WHERE is added for isolation. A write older than the current version is skipped
 *           (`false`), so a redelivered or late event never rolls a record back. Which events feed it is its
 *           listeners', never an option here.
 * Runtime: node
 * Governing contract: ADR 0294 (decision 16: `Projection` in the kind table; `@Projection` retired); ADR 0305 (rule 5:
 *                     the partner is the type argument); ADR 0163 (decision 1: read models with `asOf`); ADR 0327
 *                     (decisions 3 and 9); ADR 0160 (raw SQL with a reason).
 */
import type { EntityManager } from "@mikro-orm/postgresql";
import { createKind, kindOf, type WithPartner } from "@stackra/container";
import type { ScopeRef } from "@stackra/contracts";

import { Database } from "#core/ports/database.port";
import type { ProjectionClass } from "#core/types/projection-class.type";
import type { ProjectionOptions } from "#core/types/projection-options.type";
import type { ProjectionReadOptions } from "#core/types/projection-read-options.type";
import type { ProjectionRow } from "#core/types/projection-row.type";

/** The versions table. */
const ROWS = '"database"."projection_rows"';

/** A written key: snake_case words joined by dots. */
const KEY = /^[a-z][a-z0-9_]*(?:\.[a-z][a-z0-9_]*)*$/;

/** The largest record id, the column's length. */
const MAX_ID = 255;

/** The largest page `list` returns. */
const MAX_LIMIT = 1000;

/** The versions in effect at a moment; the current ones when there is none. */
function effective(asOf: Date | undefined): { readonly sql: string; readonly params: unknown[] } {
  return asOf === undefined
    ? { sql: "valid_to is null", params: [] }
    : { sql: "valid_from <= ? and (valid_to is null or valid_to > ?)", params: [asOf, asOf] };
}

/** The rows a statement returned. */
async function rowsOf(
  em: EntityManager,
  sql: string,
  params: readonly unknown[],
): Promise<readonly Record<string, unknown>[]> {
  return (await em.execute(sql, [...params])) as unknown as readonly Record<string, unknown>[];
}

/** A stored version as a read returns it. */
function rowOf<S extends object>(row: Record<string, unknown>): ProjectionRow<S> {
  const data = row["data"];
  return {
    id: String(row["record_id"]),
    data: (typeof data === "string" ? JSON.parse(data) : data) as S,
    validFrom: new Date(row["valid_from"] as string | Date),
  };
}

/**
 * Checks a record id.
 *
 * @throws TypeError for an empty or over-long id.
 */
function checkId(id: string): void {
  if (typeof id !== "string" || id === "" || id.length > MAX_ID)
    throw new TypeError(`A projection record id is 1 to ${MAX_ID} characters`);
}

/** The instance side every projection shares: its writes and reads. */
export abstract class ProjectionBase<S extends object = object> {
  /** Type-only kind brand, so a class of another kind cannot stand in for a projection. */
  declare readonly "~kind": "projection";

  /**
   * The key the rows are stored under.
   *
   * @throws TypeError for a class that was not declared with `Projection<S>({ key })`.
   */
  get projectionKey(): string {
    const key = kindOf(this.constructor)?.options["key"];
    if (typeof key !== "string")
      throw new TypeError(
        `${this.constructor.name} extends no Projection<S>({ key }), so it has no rows`,
      );
    return key;
  }

  /**
   * Stores `data` as the version of record `id` in `scope` from `at` on, closing the version before it.
   *
   * @param at - when the change happened: the source event's time, never the time it arrived.
   * @returns false, writing nothing, when the current version is as new as `at` or newer (a redelivered or late
   *          event).
   * @throws TypeError for a bad record id.
   * @example
   * await this.book.put(event.scope, event.orderId, { status: "paid", totalMinor: event.totalMinor }, ctx.occurredAt);
   */
  async put(scope: ScopeRef, id: string, data: S, at: Date): Promise<boolean> {
    checkId(id);
    const key = this.projectionKey;
    return this.write(scope, id, at, async (em) => {
      // raw-sql: a projection version row is this package's own table (ADR 0163 d1)
      await em.execute(
        `insert into ${ROWS} (projection_key, scope_id, scope_path, record_id, data, valid_from) ` +
          "values (?, ?, ?, ?, cast(? as jsonb), ?)",
        [key, scope.id, scope.path, id, JSON.stringify(data), at],
      );
    });
  }

  /**
   * Ends record `id` in `scope` at `at`: reads as of `at` or later no longer return it; earlier ones still do.
   *
   * @returns false when there is no current version, or it is as new as `at` or newer.
   * @throws TypeError for a bad record id.
   */
  async remove(scope: ScopeRef, id: string, at: Date): Promise<boolean> {
    checkId(id);
    return this.write(scope, id, at, async () => undefined, true);
  }

  /**
   * Record `id`, now or as of `options.asOf`, among the session's granted scopes.
   *
   * @returns undefined when no version is in effect.
   */
  async get(
    id: string,
    options: ProjectionReadOptions = {},
  ): Promise<ProjectionRow<S> | undefined> {
    const at = effective(options.asOf);
    // raw-sql: a read of this package's own table; isolation is the table's policy (ADR 0327 d9)
    const [row] = await rowsOf(
      Database.current().em(),
      `select record_id, data, valid_from from ${ROWS} where projection_key = ? and record_id = ? and ${at.sql} ` +
        "order by valid_from desc limit 1",
      [this.projectionKey, id, ...at.params],
    );
    return row === undefined ? undefined : rowOf<S>(row);
  }

  /**
   * A page of records in id order, now or as of `options.asOf`, among the session's granted scopes.
   *
   * @throws RangeError for a limit outside 1 to 1,000.
   */
  async list(options: ProjectionReadOptions = {}): Promise<readonly ProjectionRow<S>[]> {
    const limit = options.limit ?? 100;
    if (!Number.isInteger(limit) || limit < 1 || limit > MAX_LIMIT)
      throw new RangeError(`A projection page holds 1 to ${MAX_LIMIT} records, got ${limit}`);
    const at = effective(options.asOf);
    const after = options.after === undefined ? "" : " and record_id > ?";
    // raw-sql: a read of this package's own table; isolation is the table's policy (ADR 0327 d9)
    const rows = await rowsOf(
      Database.current().em(),
      `select record_id, data, valid_from from ${ROWS} where projection_key = ? and ${at.sql}${after} ` +
        "order by record_id limit ?",
      [
        this.projectionKey,
        ...at.params,
        ...(options.after === undefined ? [] : [options.after]),
        limit,
      ],
    );
    return rows.map((row) => rowOf<S>(row));
  }

  /**
   * Locks the current version, skips a stale write, closes the current version at `at` and runs `insert`.
   *
   * @param closing - true for `remove`, which needs a current version.
   */
  private write(
    scope: ScopeRef,
    id: string,
    at: Date,
    insert: (em: EntityManager) => Promise<void>,
    closing = false,
  ): Promise<boolean> {
    const database = Database.current();
    const key = this.projectionKey;
    return database.transaction(async () => {
      const em = database.em();
      // raw-sql: the current version is locked so two writers of one record take turns (ADR 0163 d1)
      const [current] = await rowsOf(
        em,
        `select valid_from from ${ROWS} where projection_key = ? and scope_id = ? and record_id = ? ` +
          "and valid_to is null for update",
        [key, scope.id, id],
      );
      if (current === undefined && closing) return false;
      if (current !== undefined) {
        if (new Date(current["valid_from"] as string | Date).getTime() >= at.getTime())
          return false;
        // raw-sql: closing the current version keeps it for `asOf` reads (ADR 0163 d1)
        await em.execute(
          `update ${ROWS} set valid_to = ? where projection_key = ? and scope_id = ? and record_id = ? ` +
            "and valid_to is null",
          [at, key, scope.id, id],
        );
      }
      await insert(em);
      return true;
    });
  }
}

/** What a called form without its type argument fails with. */
type Hint = "Name the stored row as a type argument: Projection<OrderBookRow>({ key })";

/** The called form: the row type is the partner. */
type ProjectionKind = <S extends object = never>(
  options: WithPartner<S, ProjectionOptions, Hint>,
) => ProjectionClass<S>;

/**
 * Checks the options and records exactly `key`.
 *
 * @throws TypeError for a bad key.
 */
function read(options: ProjectionOptions): Readonly<Record<string, unknown>> {
  const key = options?.key;
  if (typeof key !== "string" || !KEY.test(key))
    throw new TypeError(
      `Projection({ key }) is snake_case words joined by dots, such as "order_book", got ${JSON.stringify(key)}`,
    );
  return Object.freeze({ key });
}

/**
 * The projection kind base.
 *
 * @example
 * export class OrderBook extends Projection<OrderBookRow>({ key: "order_book" }) {}
 *
 * export class BookOnOrderPaidListener extends Listener({ queue: Queues.Default }) {
 *   constructor(book: OrderBook) {
 *     super();
 *     this.book = book;
 *   }
 *
 *   async handle(event: OrderPaid, ctx: ListenerContext): Promise<void> {
 *     await this.book.put(event.scope, event.orderId, { status: "paid", totalMinor: event.totalMinor }, ctx.occurredAt);
 *   }
 * }
 *
 * const lastMonth = await book.list({ asOf: new Date("2026-09-30T23:59:59Z"), limit: 500 });
 */
export const Projection = createKind(
  "projection",
  ProjectionBase,
  read,
) as unknown as ProjectionKind;
