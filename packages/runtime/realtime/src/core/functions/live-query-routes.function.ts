/**
 * Stackra file contract:
 * Purpose: `liveQueryRoutes(refresh)`, the broadcast routes that carry a live query's refresh signal: one per event its
 *          `cache.invalidateOn` names, under the query's permission and audience, on the channel of the event's
 *          module. A `replica:` query's refresh is this signal: the client refreshes the replica by its change cursor
 *          when it arrives (ADR 0338 decision 3).
 * Boundary: a pure function. Gen calls it once per live query from the committed manifest and hands the routes to
 *           `RealtimeBroadcaster` after the outbox relay, beside the routes of events that declare `broadcast`, so the
 *           refresh is sent after commit, once the changed rows are readable. The module is read from each event's wire
 *           name, never written; the permission is the query's, so a session that may read the query hears its refresh
 *           even when it may not read the event. The message stays data-free. A name that is not a wire name, or an
 *           empty permission, throws, so a misdeclared query fails at boot instead of going silent or wide.
 * Runtime: isomorphic
 * Governing contract: ADR 0315 (decision 1: a query with `cache.invalidateOn` is live; the channel carries the
 *                     invalidation, not the data; decision 4: IAM-authorised channels); ADR 0338 (decision 3); ADR
 *                     0141 (wire names).
 */
import type { BroadcastRoute } from "#core/types/broadcast-route.type";
import type { LiveQueryRefresh } from "#core/types/live-query-refresh.type";

/** An event wire name, `<module>.<name>.v<n>`; the first label is the producing module's key. */
const WIRE_NAME = /^([a-z][a-z0-9_]*)\.(?:[a-z][a-z0-9_]*\.)+v[1-9][0-9]*$/;

/**
 * The routes of one live query's refresh, one per distinct invalidating event.
 *
 * @throws TypeError when the permission is empty or an event's name is not a wire name.
 * @example
 * liveQueryRoutes({ permission: "sales.sale.read", audience: BroadcastAudience.Scope, invalidateOn: [SaleCompleted] });
 * // [{ name: "sales.sale.completed.v1", module: "sales", permission: "sales.sale.read", audience: "tenant" }]
 */
export function liveQueryRoutes(refresh: LiveQueryRefresh): readonly BroadcastRoute[] {
  const { permission, audience, invalidateOn } = refresh;
  if (typeof permission !== "string" || permission === "")
    throw new TypeError("A live query's refresh needs the query's permission");
  const names = [...new Set(invalidateOn.map((event) => event.eventName))];
  return Object.freeze(
    names.map((name) => {
      const module = WIRE_NAME.exec(name)?.[1];
      if (module === undefined)
        throw new TypeError(`"${name}" is not an event wire name (<module>.<name>.v<n>)`);
      return Object.freeze({ name, module, permission, audience });
    }),
  );
}
