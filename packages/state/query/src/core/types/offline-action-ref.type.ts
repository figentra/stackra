/**
 * Stackra file contract:
 * Purpose: `OfflineActionRef`, what an offline-map entry names: the generated class of a consumed action
 *          (`CreateOrderAction` from `#stackra/clients/commerce`), read by its static versioned key.
 * Boundary: a structural type, so this package never imports `@stackra/clients`: any class with a static `key`
 *           (`orders.order.create@1`) qualifies, and `@stackra/clients`' `actionRef(key, ...)` sets it.
 * Runtime: isomorphic
 * Governing contract: ADR 0260 (generated client classes); ADR 0131 (versioned action keys survive an upgrade).
 */

/** A consumed action, by its generated class. */
export interface OfflineActionRef {
  /** The versioned action key, `<module>.<model>.<verb>@<major>`. */
  readonly key: string;
}
