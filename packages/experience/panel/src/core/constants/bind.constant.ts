/**
 * Stackra file contract:
 * Purpose: `Bind`, the bound values a placement, a filter or a column reads at render time: a field of the View page's
 *          record, the dashboard's range, the List page's filter and the signed-in actor's fields
 *          (`Bind.actor.accountId`).
 * Boundary: pure: each returns a `BindRef` code (`record.totals.currency`, `range`, `table_filter.status`,
 *           `actor.accountId`). `Bind.actor` answers any field name; gen checks the name against the actor and fails
 *           a record bind outside a View slot or a filter bind outside a List slot.
 * Runtime: isomorphic
 * Governing contract: ADR 0307 (rule 18).
 */
import type { BindRef } from "#core/types/bind-ref.type";

/** The actor's fields: any string key reads `actor.<key>`. */
const ACTOR = new Proxy(Object.freeze({}), {
  get: (_target, property) => (typeof property === "string" ? `actor.${property}` : undefined),
}) as Readonly<Record<string, BindRef>>;

/**
 * Bound values.
 *
 * @example
 * c.money("unitPriceMinor", { currency: Bind.record("totals.currency") });
 * Drill.resource(OrderResource, { filter: { paidAt: Bind.range() } });
 * params: { accountId: Bind.actor.accountId }
 */
export const Bind = Object.freeze({
  /** The field at `path` of the View page's record. */
  record: (path: string): BindRef => `record.${path}` as BindRef,

  /** The dashboard's or the widget's selected range. */
  range: (): BindRef => "range" as BindRef,

  /** The List page's filter, or its value at `key`. */
  tableFilter: (key?: string): BindRef =>
    (key === undefined ? "table_filter" : `table_filter.${key}`) as BindRef,

  /** The signed-in actor's fields. */
  actor: ACTOR,
});
