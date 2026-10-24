/**
 * Stackra file contract:
 * Purpose: `RealtimeEventRef`, what a client subscribes to: the generated class of a consumed integration event
 *          (`OrderPaid` from `#stackra/clients/commerce`), read by its static wire name and typed by its instances,
 *          which are the event's payload.
 * Boundary: a structural type, so this package never imports `@stackra/clients`: any class with a static `eventName`
 *           (`orders.order.paid.v1`) qualifies, and `@stackra/clients`' `eventRef(name, ...)` sets it. Code passes the
 *           class, never a channel string or a wire name.
 * Runtime: isomorphic
 * Governing contract: ADR 0225 (broadcast); ADR 0141 (wire names); ADR 0260 (generated client classes).
 */

/** An event class a client can subscribe to; `P` is its payload. */
export interface RealtimeEventRef<P = object> {
  /** The event's wire name, `<module>.<name>.v<version>`. */
  readonly eventName: string;

  /** The payload type, carried by the class's instances. */
  readonly prototype: P;
}
