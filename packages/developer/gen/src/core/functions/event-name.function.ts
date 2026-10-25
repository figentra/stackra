/**
 * Stackra file contract:
 * Purpose: `eventName`, the wire name of an event: the module key, the written `name`, and `.v<n>` for an
 *          integration event (`orders.order.paid.v1`); a domain event carries no version.
 * Boundary: pure.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 20: integration event); ADR 0141 as amended by 0294; ADR 0305 (rule 19).
 */

/**
 * The wire name of an event.
 *
 * @param module - the module key.
 * @param name - the written name (`order.paid`).
 * @param version - the integration event version; absent for a domain event.
 * @example
 * eventName("orders", "order.paid", 1); // "orders.order.paid.v1"
 * eventName("loyalty_kit", "points.redeemed"); // "loyalty_kit.points.redeemed"
 */
export function eventName(module: string, name: string, version?: number): string {
  return version === undefined ? `${module}.${name}` : `${module}.${name}.v${version}`;
}
