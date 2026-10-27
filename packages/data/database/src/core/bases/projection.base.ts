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
import { createKind, type WithPartner } from "@stackra/container";

import { ProjectionBase } from "#core/bases/projection-base.base";
import type { ProjectionClass } from "#core/types/projection-class.type";
import type { ProjectionOptions } from "#core/types/projection-options.type";

/** A written key: snake_case words joined by dots. */
const KEY = /^[a-z][a-z0-9_]*(?:\.[a-z][a-z0-9_]*)*$/;

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
